import { type WebhookEnv, readWebhookEnv } from "./env";
import { failureResponse, json, methodNotAllowed } from "./http";
import { type Catalog, getCatalog } from "./catalog";
import { parseOrderCreatedEvent, resolveOrderPack, verifyWebhookSignature } from "./lemon-squeezy";
import { createLoopsClient, type LoopsClient } from "./loops";
import { createOrder } from "./order";
import { type KVBackend, netlifyBlobsBackend } from "./orders-store";

export interface WebhookHandlerDeps {
  readEnv: () => WebhookEnv;
  store: () => KVBackend;
  loops: (apiKey: string) => LoopsClient;
  catalog: () => Catalog;
  /** Seconds since epoch. */
  now: () => number;
}

export const prodWebhookDeps: WebhookHandlerDeps = {
  readEnv: readWebhookEnv,
  store: netlifyBlobsBackend,
  loops: (apiKey) => createLoopsClient(apiKey),
  catalog: getCatalog,
  now: () => Math.floor(Date.now() / 1000),
};

/**
 * POST /lemon-squeezy-webhook — creates the order and mails the download link.
 * A failure after the signature check answers 500 so Lemon Squeezy retries.
 */
export function createWebhookHandler(deps: WebhookHandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") return methodNotAllowed();

    try {
      const env = deps.readEnv();
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
        return json({ ok: true, ignored: true }, 200);
      }

      // What the buyer gets is decided by the variant they paid for, never by
      // the `pack_slug` in the checkout URL. A paid order we can't map must
      // fail loudly (non-2xx shows in the LS webhook log and the function
      // logs), not answer 200 and leave the buyer without their pack.
      const catalog = deps.catalog();
      const resolved = resolveOrderPack(catalog, parsed);
      if (!resolved.ok) {
        console.error(
          `Paid order ${resolved.orderId} not delivered: ${resolved.reason} (variant ${parsed.variantId ?? "none"}, claimed slug ${parsed.claimedSlug ?? "none"})`,
        );
        return json({ ok: false, reason: resolved.reason }, 422);
      }
      const order = resolved.order;
      if (parsed.claimedSlug && parsed.claimedSlug !== order.packSlug) {
        console.warn(
          `Order ${order.orderId}: custom_data.pack_slug "${parsed.claimedSlug}" ignored, variant ${parsed.variantId} is "${order.packSlug}"`,
        );
      }

      await createOrder(
        {
          store: deps.store(),
          loops: deps.loops(env.loopsApiKey),
          jwtSecret: env.jwtSecret,
          loopsTransactionalId: env.loopsTransactionalId,
          publicSiteUrl: env.publicSiteUrl,
          packNameOf: (slug) => catalog.bySlug(slug)?.name,
          now: deps.now,
        },
        order,
      );

      return json({ ok: true }, 200);
    } catch (err) {
      return failureResponse("lemon-squeezy-webhook", err);
    }
  };
}
