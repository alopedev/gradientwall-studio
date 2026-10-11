import type { LoopsClient } from "./loops";
import {
  consumeDownload,
  extendDeadline,
  getOrder,
  isExhausted,
  isExpired,
  putOrder,
  type KVBackend,
  type OrderRecord,
} from "./orders-store";
import { issueDownloadToken, verifyDownloadToken } from "./signed-token";

/**
 * The order lifecycle in one place: created by the Lemon Squeezy webhook,
 * re-linked by /recover, spent by /download. The three handlers only wire
 * dependencies and map the results below to HTTP.
 *
 * What the lifecycle shares lives here once: the policy numbers, the rule
 * "token `exp` always equals the stored `expiresAt`", how a download link is
 * built and mailed, and (in `orders-store`) the single `isExpired` check.
 */

const DAY_SECONDS = 60 * 60 * 24;
const PURCHASE_TTL_SECONDS = 30 * DAY_SECONDS;
const RECOVER_TTL_SECONDS = 7 * DAY_SECONDS;
const DOWNLOADS_ALLOWED = 5;

/** Dependencies every operation needs. `now` is injected so tests pin the clock. */
export interface OrderDeps {
  store: KVBackend;
  jwtSecret: string;
  /** Seconds since epoch. */
  now: () => number;
}

/** Dependencies of the operations that email a download link. */
export interface MailDeps {
  loops: LoopsClient;
  loopsTransactionalId: string;
  publicSiteUrl: string;
  /** Display name for a pack slug (the catalog). Falls back to the slug itself. */
  packNameOf?: (packSlug: string) => string | undefined;
}

// ---------------------------------------------------------------------------
// Shared steps
// ---------------------------------------------------------------------------

/** Signs a token that lives exactly as long as the order does. */
async function downloadUrlFor(
  deps: OrderDeps & Pick<MailDeps, "publicSiteUrl">,
  order: OrderRecord,
  now: number,
): Promise<string> {
  const token = await issueDownloadToken({
    payload: { orderId: order.orderId, packSlug: order.packSlug, email: order.email },
    ttlSeconds: order.expiresAt - now,
    secret: deps.jwtSecret,
    iat: now,
  });
  return `${deps.publicSiteUrl}/.netlify/functions/download?token=${encodeURIComponent(token)}`;
}

async function mailDownloadLink(
  deps: MailDeps,
  order: OrderRecord,
  downloadUrl: string,
): Promise<void> {
  await deps.loops.sendTransactional({
    transactionalId: deps.loopsTransactionalId,
    email: order.email,
    dataVariables: {
      packName: deps.packNameOf?.(order.packSlug) ?? order.packSlug,
      downloadUrl,
    },
  });
}

// ---------------------------------------------------------------------------
// Created (webhook)
// ---------------------------------------------------------------------------

export interface CreateOrderDeps extends OrderDeps, MailDeps {
  ttlSeconds?: number;
  downloadsAllowed?: number;
}

export interface CreateOrderInput {
  orderId: string;
  packSlug: string;
  email: string;
}

export interface CreateOrderResult {
  downloadUrl: string;
  expiresAt: number;
}

/**
 * Idempotent-ish: re-receiving the same order_created webhook (LS retries)
 * will overwrite the order record with a fresh token and reset the counter.
 * That's a deliberate trade-off — webhook retries are a real possibility and
 * the alternative (silently ignoring re-receives) hides a class of bugs
 * where the buyer never got the first email.
 */
export async function createOrder(
  deps: CreateOrderDeps,
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const now = deps.now();
  const order: OrderRecord = {
    orderId: input.orderId,
    packSlug: input.packSlug,
    email: input.email,
    downloadsRemaining: deps.downloadsAllowed ?? DOWNLOADS_ALLOWED,
    expiresAt: now + (deps.ttlSeconds ?? PURCHASE_TTL_SECONDS),
    createdAt: now,
  };

  const downloadUrl = await downloadUrlFor(deps, order, now);
  await putOrder(deps.store, order);
  await mailDownloadLink(deps, order, downloadUrl);

  return { downloadUrl, expiresAt: order.expiresAt };
}

// ---------------------------------------------------------------------------
// Recover
// ---------------------------------------------------------------------------

export interface RecoverOrderDeps extends OrderDeps, MailDeps {
  /**
   * Looks up the email of record for an order in the upstream payment
   * provider (Lemon Squeezy in prod). Returning `null` is the canonical
   * "no such order" signal — the caller should treat thrown errors the
   * same way (defensive: see recoverOrder catching below). Injected as
   * a function (not an apiKey) so this orchestration layer never knows
   * about HTTP transport.
   */
  lookupOrderEmail: (orderId: string) => Promise<{ email: string } | null>;
  ttlSeconds?: number;
}

export interface RecoverOrderInput {
  email: string;
  orderId: string;
}

export type RecoverOutcome =
  | { ok: true; reason: "reissued"; expiresAt: number }
  | {
      ok: true;
      reason:
        | "bad_input"
        | "order_not_found"
        | "expired"
        | "exhausted"
        | "ls_lookup_failed"
        | "email_mismatch"
        | "busy";
    };

/**
 * Re-issue the download link for a known paid order. Idempotent: re-running
 * preserves `downloadsRemaining` and `createdAt`, only `expiresAt` and the
 * JWT are refreshed. This contrasts with `createOrder`, which resets the
 * counter on every webhook delivery.
 *
 * Anti-enumeration: every failure mode returns `ok: true` so the handler can
 * respond with a single generic 200. The `reason` field is for logs and
 * tests — not the HTTP wire.
 */
export async function recoverOrder(
  deps: RecoverOrderDeps,
  input: RecoverOrderInput,
): Promise<RecoverOutcome> {
  const email = input.email.trim().toLowerCase();
  const orderId = input.orderId.trim();
  if (!email || !orderId) {
    return { ok: true, reason: "bad_input" };
  }

  const stored = await getOrder(deps.store, orderId);
  if (!stored) return { ok: true, reason: "order_not_found" };

  const now = deps.now();

  // Cheap checks first, so a dead order never costs an upstream call. The
  // extension below re-checks against the fresh record.
  if (isExpired(stored, now)) return { ok: true, reason: "expired" };
  if (isExhausted(stored)) return { ok: true, reason: "exhausted" };

  const lsLookup = await deps.lookupOrderEmail(orderId).catch(() => null);
  if (!lsLookup) return { ok: true, reason: "ls_lookup_failed" };

  const lsEmail = lsLookup.email.trim().toLowerCase();
  if (!constantTimeEqual(lsEmail, email)) {
    return { ok: true, reason: "email_mismatch" };
  }

  // Never shortens the Deadline — recovery only extends if it benefits the buyer.
  // See docs/adr/0001-recovery-semantics.md. Atomic against concurrent
  // downloads: their decrement is never overwritten by ours.
  const extended = await extendDeadline(
    deps.store,
    orderId,
    now,
    deps.ttlSeconds ?? RECOVER_TTL_SECONDS,
  );
  if (!extended.ok) {
    if (extended.reason === "not_found") return { ok: true, reason: "order_not_found" };
    if (extended.reason === "conflict") return { ok: true, reason: "busy" };
    return { ok: true, reason: extended.reason };
  }

  const downloadUrl = await downloadUrlFor(deps, extended.order, now);

  // Send to the email stored with the order (consistency with the original
  // purchase) rather than `lsEmail` — the buyer might have changed their LS
  // email after the sale, but the receipt history was always to the stored one.
  await mailDownloadLink(deps, extended.order, downloadUrl);

  return { ok: true, reason: "reissued", expiresAt: extended.order.expiresAt };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

export interface RedeemDownloadDeps extends OrderDeps {
  /** Returns a time-limited URL pointing at the pack ZIP for the given slug. */
  presign: (packSlug: string) => Promise<string>;
}

export type DownloadResult =
  | { ok: true; redirectUrl: string; remaining: number }
  | { ok: false; status: 401; reason: "invalid_token" | "expired_token" }
  | { ok: false; status: 403; reason: "exhausted" | "expired_order" | "not_found" }
  | { ok: false; status: 503; reason: "busy" };

/**
 * Resolve a download token to either a redirect URL (signed R2 link) or an
 * error reason. The caller maps that into HTTP. Keeping the domain logic
 * here pure means we test the entire decision tree without spinning up R2
 * or a real Blobs store.
 */
export async function redeemDownload(
  deps: RedeemDownloadDeps,
  token: string | null,
): Promise<DownloadResult> {
  if (!token) return { ok: false, status: 401, reason: "invalid_token" };

  const verified = await verifyDownloadToken(token, deps.jwtSecret);
  if (!verified.ok) {
    return {
      ok: false,
      status: 401,
      reason: verified.reason === "expired" ? "expired_token" : "invalid_token",
    };
  }

  const consume = await consumeDownload(deps.store, verified.payload.orderId, deps.now());
  if (!consume.ok) {
    if (consume.reason === "not_found") return { ok: false, status: 403, reason: "not_found" };
    if (consume.reason === "exhausted") return { ok: false, status: 403, reason: "exhausted" };
    if (consume.reason === "conflict") return { ok: false, status: 503, reason: "busy" };
    return { ok: false, status: 403, reason: "expired_order" };
  }

  const redirectUrl = await deps.presign(verified.payload.packSlug);
  return { ok: true, redirectUrl, remaining: consume.remaining };
}
