import { type DownloadEnv, readDownloadEnv } from "./env";
import { failureResponse, json, methodNotAllowed } from "./http";
import { redeemDownload } from "./order";
import type { OrderStore } from "./orders-store";
import { prodOrderStore } from "./prod-order-store";
import { packZipKey, presignDownloadUrl } from "./r2";

const PRESIGN_TTL_SECONDS = 60 * 5; // 5 minutes — enough to start the download

/**
 * Every answer spends or reports on a download, so no cache may keep it (a
 * cached 302 would hand out the presigned URL again for free), and the
 * tokened URL is never sent on as a Referer.
 */
const NO_STORE = { "cache-control": "no-store", "referrer-policy": "no-referrer" };

export interface DownloadHandlerDeps {
  readEnv: () => DownloadEnv;
  store: () => OrderStore;
  presign: (env: DownloadEnv, packSlug: string) => Promise<string>;
  /** Seconds since epoch. */
  now: () => number;
}

export const prodDownloadDeps: DownloadHandlerDeps = {
  readEnv: readDownloadEnv,
  store: () => prodOrderStore(),
  presign: (env, slug) =>
    presignDownloadUrl(
      {
        accountId: env.r2AccountId,
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
        bucket: env.r2BucketPacks,
      },
      packZipKey(slug),
      PRESIGN_TTL_SECONDS,
    ),
  now: () => Math.floor(Date.now() / 1000),
};

/** GET /download?token=… — spends one download and redirects to a presigned R2 URL. */
export function createDownloadHandler(deps: DownloadHandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== "GET") return methodNotAllowed();

    try {
      const env = deps.readEnv();
      const token = new URL(req.url).searchParams.get("token");

      const result = await redeemDownload(
        {
          store: deps.store(),
          jwtSecret: env.jwtSecret,
          now: deps.now,
          presign: (slug) => deps.presign(env, slug),
        },
        token,
      );

      if (!result.ok) {
        return json(
          { ok: false, reason: result.reason },
          result.status,
          // Contention on the order record is transient: tell clients to retry.
          result.status === 503 ? { ...NO_STORE, "retry-after": "1" } : NO_STORE,
        );
      }
      return new Response(null, {
        status: 302,
        headers: { ...NO_STORE, location: result.redirectUrl },
      });
    } catch (err) {
      const res = failureResponse("download", err);
      for (const [k, v] of Object.entries(NO_STORE)) res.headers.set(k, v);
      return res;
    }
  };
}
