import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify the X-Signature header against the raw request body using the
 * webhook signing secret configured in Lemon Squeezy.
 *
 * LS signs the raw bytes — pass the body string exactly as received, before
 * any JSON parse or re-stringify (re-stringify reorders keys + alters
 * whitespace and breaks the signature).
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
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
    };
  };
}

export interface ParsedOrder {
  /** `data.id` from the LS webhook — buyer-visible id. NOT our `orderId`. */
  lsOrderId: string;
  email: string;
  packSlug: string;
}

/**
 * Pull the fields we need from a parsed webhook body. Returns null if the
 * shape is wrong or this isn't an event we care about (LS sends many event
 * types — we only act on completed orders).
 */
export function parseOrderCreatedEvent(body: unknown): ParsedOrder | null {
  if (!isOrderCreatedEvent(body)) return null;
  if (body.meta.event_name !== "order_created") return null;
  if (body.data.attributes.status !== "paid") return null;
  const packSlug = body.meta.custom_data?.pack_slug;
  if (!packSlug) return null;
  return {
    lsOrderId: body.data.id,
    email: body.data.attributes.user_email,
    packSlug,
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
