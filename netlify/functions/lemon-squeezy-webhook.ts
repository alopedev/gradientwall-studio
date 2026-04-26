import type { Context } from "@netlify/functions";
import { readEnv } from "./_lib/env";
import { parseOrderCreatedEvent, verifyWebhookSignature } from "./_lib/lemon-squeezy";
import { netlifyBlobsBackend } from "./_lib/orders-store";
import { createLoopsClient } from "./_lib/loops";
import { processOrderCreated } from "./_lib/process-order";

export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const env = readEnv();
  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, req.headers.get("x-signature"), env.lsWebhookSecret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const order = parseOrderCreatedEvent(body);
  if (!order) {
    // Not an event we act on (subscription_*, refund_*, etc.) — 200 so LS
    // doesn't retry.
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  await processOrderCreated(
    {
      store: netlifyBlobsBackend(),
      loops: createLoopsClient(env.loopsApiKey),
      jwtSecret: env.jwtSecret,
      loopsTransactionalId: env.loopsTransactionalId,
      publicSiteUrl: env.publicSiteUrl,
      now: () => Math.floor(Date.now() / 1000),
    },
    order,
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
