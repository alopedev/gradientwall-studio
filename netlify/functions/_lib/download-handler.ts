import { type DownloadEnv, readDownloadEnv } from "./env";
import { failureResponse, json, methodNotAllowed } from "./http";
import { redeemDownload } from "./order";
import { type KVBackend, netlifyBlobsBackend } from "./orders-store";
import { packZipKey, presignDownloadUrl } from "./r2";

const PRESIGN_TTL_SECONDS = 60 * 5; // 5 minutes — enough to start the download

export interface DownloadHandlerDeps {
  readEnv: () => DownloadEnv;
  store: () => KVBackend;
  presign: (env: DownloadEnv, packSlug: string) => Promise<string>;
  /** Seconds since epoch. */
  now: () => number;
}

export const prodDownloadDeps: DownloadHandlerDeps = {
  readEnv: readDownloadEnv,
  store: netlifyBlobsBackend,
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
          result.status === 503 ? { "retry-after": "1" } : {},
        );
      }
      return Response.redirect(result.redirectUrl, 302);
    } catch (err) {
      return failureResponse("download", err);
    }
  };
}
