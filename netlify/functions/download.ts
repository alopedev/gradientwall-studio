import type { Context } from "@netlify/functions";
import { readEnv } from "./_lib/env";
import { netlifyBlobsBackend } from "./_lib/orders-store";
import { packZipKey, presignDownloadUrl } from "./_lib/r2";
import { processDownload } from "./_lib/process-download";

const PRESIGN_TTL_SECONDS = 60 * 5; // 5 minutes — enough to start the download

export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const env = readEnv();
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  const result = await processDownload(
    {
      store: netlifyBlobsBackend(),
      jwtSecret: env.jwtSecret,
      now: () => Math.floor(Date.now() / 1000),
      presign: (slug) =>
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
    },
    token,
  );

  if (!result.ok) {
    return new Response(JSON.stringify({ ok: false, reason: result.reason }), {
      status: result.status,
      headers: { "content-type": "application/json" },
    });
  }

  return Response.redirect(result.redirectUrl, 302);
};
