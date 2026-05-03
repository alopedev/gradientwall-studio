import { issueDownloadToken } from "./signed-token";
import { getOrder, putOrder, type KVBackend } from "./orders-store";
import type { LoopsClient } from "./loops";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface ProcessRecoverDeps {
  store: KVBackend;
  loops: LoopsClient;
  /**
   * Looks up the email of record for an order in the upstream payment
   * provider (Lemon Squeezy in prod). Returning `null` is the canonical
   * "no such order" signal — the caller should treat thrown errors the
   * same way (defensive: see processRecover catching below). Injected as
   * a function (not an apiKey) so this orchestration layer never knows
   * about HTTP transport.
   */
  lookupOrderEmail: (orderId: string) => Promise<{ email: string } | null>;
  jwtSecret: string;
  loopsTransactionalId: string;
  publicSiteUrl: string;
  /** Seconds since epoch. Injected so JWT exp matches store expiresAt exactly. */
  now: () => number;
  ttlSeconds?: number;
}

export interface ProcessRecoverInput {
  email: string;
  orderId: string;
}

export type RecoverOutcome =
  | { ok: true; reason: "reissued"; expiresAt: number }
  | {
      ok: true;
      reason: "bad_input" | "order_not_found" | "ls_lookup_failed" | "email_mismatch";
    };

/**
 * Re-issue the download link for a known paid order. Idempotent: re-running
 * preserves `downloadsRemaining` and `createdAt`, only `expiresAt` and the
 * JWT are refreshed. This contrasts with `processOrderCreated`, which resets
 * the counter on every webhook delivery.
 *
 * Anti-enumeration: every failure mode returns `ok: true` so the handler can
 * respond with a single generic 200. The `reason` field is for logs and
 * tests — not the HTTP wire.
 */
export async function processRecover(
  deps: ProcessRecoverDeps,
  input: ProcessRecoverInput,
): Promise<RecoverOutcome> {
  const email = input.email.trim().toLowerCase();
  const orderId = input.orderId.trim();
  if (!email || !orderId) {
    return { ok: true, reason: "bad_input" };
  }

  const stored = await getOrder(deps.store, orderId);
  if (!stored) return { ok: true, reason: "order_not_found" };

  const lsLookup = await deps.lookupOrderEmail(orderId).catch(() => null);
  if (!lsLookup) return { ok: true, reason: "ls_lookup_failed" };

  const lsEmail = lsLookup.email.trim().toLowerCase();
  if (!constantTimeEqual(lsEmail, email)) {
    return { ok: true, reason: "email_mismatch" };
  }

  const ttlSeconds = deps.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const now = deps.now();
  const expiresAt = now + ttlSeconds;

  const token = await issueDownloadToken({
    payload: { orderId: stored.orderId, packSlug: stored.packSlug, email: stored.email },
    ttlSeconds,
    secret: deps.jwtSecret,
    iat: now,
  });

  // Re-read just before write to minimise the window where a concurrent
  // /download call could decrement downloadsRemaining and have its update
  // clobbered by ours. Same shape as `consumeDownload` — we don't have CAS
  // on Netlify Blobs, but we keep the read-write window as small as we can.
  const fresh = (await getOrder(deps.store, orderId)) ?? stored;
  await putOrder(deps.store, { ...fresh, expiresAt });

  const downloadUrl = `${deps.publicSiteUrl}/.netlify/functions/download?token=${encodeURIComponent(token)}`;

  // Send to `stored.email` (consistency with the original purchase) rather
  // than `lsEmail` — the buyer might have changed their LS email after the
  // sale, but the receipt history was always to `stored.email`.
  await deps.loops.sendTransactional({
    transactionalId: deps.loopsTransactionalId,
    email: stored.email,
    dataVariables: {
      packName: stored.packSlug,
      downloadUrl,
    },
  });

  return { ok: true, reason: "reissued", expiresAt };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
