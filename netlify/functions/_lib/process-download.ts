import { verifyDownloadToken } from "./signed-token";
import { consumeDownload, type KVBackend } from "./orders-store";

export interface ProcessDownloadDeps {
  store: KVBackend;
  jwtSecret: string;
  /** Returns a time-limited URL pointing at the pack ZIP for the given slug. */
  presign: (packSlug: string) => Promise<string>;
  now: () => number;
}

export type DownloadResult =
  | { ok: true; redirectUrl: string; remaining: number }
  | { ok: false; status: 401; reason: "invalid_token" | "expired_token" }
  | { ok: false; status: 403; reason: "exhausted" | "expired_order" | "not_found" };

/**
 * Resolve a download token to either a redirect URL (signed R2 link) or an
 * error reason. The caller maps that into HTTP. Keeping the domain logic
 * here pure means we test the entire decision tree without spinning up R2
 * or a real Blobs store.
 */
export async function processDownload(
  deps: ProcessDownloadDeps,
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
    return { ok: false, status: 403, reason: "expired_order" };
  }

  const redirectUrl = await deps.presign(verified.payload.packSlug);
  return { ok: true, redirectUrl, remaining: consume.remaining };
}
