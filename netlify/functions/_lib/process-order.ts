import { issueDownloadToken } from "./signed-token";
import { putOrder, type KVBackend } from "./orders-store";
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
  ttlSeconds?: number;
  downloadsAllowed?: number;
}

export interface ProcessOrderInput {
  orderId: string;
  packSlug: string;
  email: string;
}

export interface ProcessOrderResult {
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
export async function processOrderCreated(
  deps: ProcessOrderDeps,
  input: ProcessOrderInput,
): Promise<ProcessOrderResult> {
  const ttlSeconds = deps.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const downloadsAllowed = deps.downloadsAllowed ?? DEFAULT_DOWNLOADS_ALLOWED;
  const now = deps.now();
  const expiresAt = now + ttlSeconds;

  const token = await issueDownloadToken({
    payload: input,
    ttlSeconds,
    secret: deps.jwtSecret,
    iat: now,
  });

  await putOrder(deps.store, {
    orderId: input.orderId,
    packSlug: input.packSlug,
    email: input.email,
    downloadsRemaining: downloadsAllowed,
    expiresAt,
    createdAt: now,
  });

  const downloadUrl = `${deps.publicSiteUrl}/.netlify/functions/download?token=${encodeURIComponent(token)}`;

  await deps.loops.sendTransactional({
    transactionalId: deps.loopsTransactionalId,
    email: input.email,
    dataVariables: {
      packName: input.packSlug,
      downloadUrl,
    },
  });

  return { downloadUrl, expiresAt };
}
