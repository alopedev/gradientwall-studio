import { createHmac, timingSafeEqual } from "node:crypto";
import type { Catalog } from "./catalog";

/**
 * Verify the X-Signature header against the raw request body using the
 * webhook signing secret configured in Lemon Squeezy.
 *
 * LS signs the raw bytes — pass the body string exactly as received, before
 * any JSON parse or re-stringify (re-stringify reorders keys + alters
 * whitespace and breaks the signature).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  // Buffers must be the same length for timingSafeEqual; mismatched length
  // is by definition invalid.
  if (signature.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/**
 * Subset of the LS `order_created` event payload we actually consume.
 * Documented at https://docs.lemonsqueezy.com/help/webhooks
 */
export interface LSOrderCreated {
  meta: {
    event_name: string;
    custom_data?: Record<string, string>;
  };
  data: {
    id: string;
    type: "orders";
    attributes: {
      user_email: string;
      status: string;
      /** What was paid for. `variant_id` is a number in LS payloads. */
      first_order_item?: { variant_id?: number | string };
    };
  };
}

/**
 * A paid order as the webhook reports it. `variantId` is what was actually
 * bought; `claimedSlug` is the buyer-editable `custom_data.pack_slug` and must
 * never be used to decide what to deliver (see `resolveOrderPack`).
 */
export interface ParsedOrder {
  orderId: string;
  email: string;
  variantId: string | null;
  claimedSlug: string | null;
}

export type ResolvedOrder =
  | { ok: true; order: { orderId: string; email: string; packSlug: string } }
  | { ok: false; reason: "missing_variant" | "unknown_variant"; orderId: string };

/**
 * Decide which pack a paid order entitles the buyer to, from the purchased
 * variant alone. A paid order that can't be mapped is an error, not an
 * "ignored" event: the buyer has paid and must not be dropped silently.
 */
export function resolveOrderPack(catalog: Catalog, parsed: ParsedOrder): ResolvedOrder {
  if (!parsed.variantId) {
    return { ok: false, reason: "missing_variant", orderId: parsed.orderId };
  }
  const pack = catalog.byVariant(parsed.variantId);
  if (!pack) return { ok: false, reason: "unknown_variant", orderId: parsed.orderId };
  return {
    ok: true,
    order: {
      orderId: parsed.orderId,
      email: parsed.email,
      packSlug: pack.slug,
    },
  };
}

/**
 * Pull the fields we need from a parsed webhook body. Returns null if the
 * shape is wrong or this isn't an event we care about (LS sends many event
 * types — we only act on completed orders). A paid order is always returned,
 * even without a variant or slug: deciding what to do with it is
 * `resolveOrderPack`'s job.
 */
export function parseOrderCreatedEvent(body: unknown): ParsedOrder | null {
  if (!isOrderCreatedEvent(body)) return null;
  if (body.meta.event_name !== "order_created") return null;
  if (body.data.attributes.status !== "paid") return null;
  const variant = body.data.attributes.first_order_item?.variant_id;
  const claimed = body.meta.custom_data?.pack_slug;
  return {
    orderId: body.data.id,
    email: body.data.attributes.user_email,
    variantId: variant == null || variant === "" ? null : String(variant),
    claimedSlug: typeof claimed === "string" && claimed !== "" ? claimed : null,
  };
}

function isOrderCreatedEvent(body: unknown): body is LSOrderCreated {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const meta = b.meta as Record<string, unknown> | undefined;
  const data = b.data as Record<string, unknown> | undefined;
  if (!meta || typeof meta.event_name !== "string") return false;
  if (!data || typeof data.id !== "string") return false;
  const attr = data.attributes as Record<string, unknown> | undefined;
  if (!attr || typeof attr.user_email !== "string" || typeof attr.status !== "string") return false;
  return true;
}
