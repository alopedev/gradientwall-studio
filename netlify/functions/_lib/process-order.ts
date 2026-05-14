import { randomUUID } from "node:crypto";
import { issueDownloadToken } from "./signed-token";
import { putLsOrderPointer, putOrder, type KVBackend } from "./orders-store";
import type { LoopsClient } from "./loops";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const DEFAULT_DOWNLOADS_ALLOWED = 5;

export interface ProcessOrderDeps {
  store: KVBackend;
  loops: LoopsClient;
  jwtSecret: string;
  loopsTransactionalId: string;
  publicSiteUrl: string;
  /** Seconds since epoch. Injected so tests pin time. */
  now: () => number;
  /**
   * UUID factory for our own `orderId`. Injectable so tests can pin it. In
   * prod this is `crypto.randomUUID()` (Node 18+ / Functions runtime).
   */
  uuid?: () => string;
  ttlSeconds?: number;
  downloadsAllowed?: number;
}

export interface ProcessOrderInput {
  /** The id Lemon Squeezy sent us (data.id on the webhook). Buyer-visible. */
  lsOrderId: string;
  packSlug: string;
  email: string;
}

export interface ProcessOrderResult {
  orderId: string;
  downloadUrl: string;
  expiresAt: number;
}

/**
 * Idempotent-ish: re-receiving the same order_created webhook (LS retries)
 * will mint a fresh `orderId`, overwrite the pointer at `ls:{lsOrderId}`, and
 * issue a new token. The previous Order record is orphaned but harmless — the
 * old JWT still verifies cryptographically but `consumeDownload` will return
 * not_found because the pointer has moved on. That's a deliberate trade-off:
 * webhook retries are real, and silently ignoring re-receives hides a class of
 * bugs where the buyer never got the first email.
 */
export async function processOrderCreated(
  deps: ProcessOrderDeps,
  input: ProcessOrderInput,
): Promise<ProcessOrderResult> {
  const ttlSeconds = deps.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const downloadsAllowed = deps.downloadsAllowed ?? DEFAULT_DOWNLOADS_ALLOWED;
  const now = deps.now();
  const expiresAt = now + ttlSeconds;
  const orderId = (deps.uuid ?? randomUUID)();

  const token = await issueDownloadToken({
    payload: { orderId, packSlug: input.packSlug, email: input.email },
    ttlSeconds,
    secret: deps.jwtSecret,
    iat: now,
  });

  await putOrder(deps.store, {
    orderId,
    lsOrderId: input.lsOrderId,
    packSlug: input.packSlug,
    email: input.email,
    downloadsRemaining: downloadsAllowed,
    expiresAt,
    createdAt: now,
  });
  await putLsOrderPointer(deps.store, input.lsOrderId, orderId);

  const downloadUrl = `${deps.publicSiteUrl}/.netlify/functions/download?token=${encodeURIComponent(token)}`;

  await deps.loops.sendTransactional({
    transactionalId: deps.loopsTransactionalId,
    email: input.email,
    dataVariables: {
      packName: input.packSlug,
      downloadUrl,
    },
  });

  return { orderId, downloadUrl, expiresAt };
}
