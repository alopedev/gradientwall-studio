import type { Context } from "@netlify/functions";
import { readEnv } from "./_lib/env";
import { getCatalog } from "./_lib/catalog";
import {
  parseOrderCreatedEvent,
  resolveOrderPack,
  verifyWebhookSignature,
} from "./_lib/lemon-squeezy";
import { netlifyBlobsBackend } from "./_lib/orders-store";
import { createLoopsClient } from "./_lib/loops";
import { createOrder } from "./_lib/order";

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

  const parsed = parseOrderCreatedEvent(body);
  if (!parsed) {
    // Not an event we act on (subscription_*, refund_*, etc.) — 200 so LS
    // doesn't retry.
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  // What the buyer gets is decided by the variant they paid for, never by the
  // `pack_slug` in the checkout URL. A paid order we can't map must fail
  // loudly (non-2xx shows in the LS webhook log and the function logs), not
  // answer 200 and leave the buyer without their pack.
  const resolved = resolveOrderPack(getCatalog(), parsed);
  if (!resolved.ok) {
    console.error(
      `Paid order ${resolved.orderId} not delivered: ${resolved.reason} (variant ${parsed.variantId ?? "none"}, claimed slug ${parsed.claimedSlug ?? "none"})`,
    );
    return new Response(JSON.stringify({ ok: false, reason: resolved.reason }), {
      status: 422,
      headers: { "content-type": "application/json" },
    });
  }
  const order = resolved.order;
  if (parsed.claimedSlug && parsed.claimedSlug !== order.packSlug) {
    console.warn(
      `Order ${order.orderId}: custom_data.pack_slug "${parsed.claimedSlug}" ignored, variant ${parsed.variantId} is "${order.packSlug}"`,
    );
  }

  await createOrder(
    {
      store: netlifyBlobsBackend(),
      loops: createLoopsClient(env.loopsApiKey),
      jwtSecret: env.jwtSecret,
      loopsTransactionalId: env.loopsTransactionalId,
      publicSiteUrl: env.publicSiteUrl,
      packNameOf: (slug) => getCatalog().bySlug(slug)?.name,
      now: () => Math.floor(Date.now() / 1000),
    },
    order,
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
