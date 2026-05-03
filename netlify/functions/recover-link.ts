import type { Context } from "@netlify/functions";
import { readEnv } from "./_lib/env";
import { netlifyBlobsBackend } from "./_lib/orders-store";
import { createLoopsClient } from "./_lib/loops";
import { fetchOrderEmail } from "./_lib/ls-api";
import { processRecover } from "./_lib/process-recover";

/**
 * POST /recover-link — re-issues the download email for a known paid order.
 * Always returns the same generic 200 to prevent enumerating valid order IDs;
 * `outcome.reason` is only used for server-side observability.
 */
export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { email?: string; orderId?: string };
  try {
    body = (await req.json()) as { email?: string; orderId?: string };
  } catch {
    return json({ ok: false, error: "Bad JSON" }, 400);
  }

  const env = readEnv();
  const outcome = await processRecover(
    {
      store: netlifyBlobsBackend(),
      loops: createLoopsClient(env.loopsApiKey),
      lookupOrderEmail: (orderId) => fetchOrderEmail(orderId, env.lsApiKey),
      jwtSecret: env.jwtSecret,
      loopsTransactionalId: env.loopsTransactionalId,
      publicSiteUrl: env.publicSiteUrl,
      now: () => Math.floor(Date.now() / 1000),
    },
    { email: body.email ?? "", orderId: body.orderId ?? "" },
  );

  console.log("[recover-link]", { reason: outcome.reason });
  return json(
    {
      ok: true,
      message: "If the order exists, a recovery email has been sent.",
    },
    200,
  );
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
