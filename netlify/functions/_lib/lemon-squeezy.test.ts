// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { buildCatalog } from "./catalog";
import { parseOrderCreatedEvent, resolveOrderPack, verifyWebhookSignature } from "./lemon-squeezy";

const SECRET = "ls-test-secret";

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  it("accepts a signature produced from the same body and secret", () => {
    const body = '{"hello":"world"}';
    expect(verifyWebhookSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects when the body has been altered after signing", () => {
    const body = '{"hello":"world"}';
    const tampered = '{"hello":"world!"}';
    expect(verifyWebhookSignature(tampered, sign(body), SECRET)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyWebhookSignature("{}", null, SECRET)).toBe(false);
  });

  it("rejects a signature of wrong length without crashing", () => {
    expect(verifyWebhookSignature("{}", "deadbeef", SECRET)).toBe(false);
  });

  it("rejects a signature signed with a different secret", () => {
    const body = "payload";
    const otherSig = createHmac("sha256", "wrong").update(body).digest("hex");
    expect(verifyWebhookSignature(body, otherSig, SECRET)).toBe(false);
  });
});

describe("parseOrderCreatedEvent", () => {
  const validEvent = {
    meta: { event_name: "order_created", custom_data: { pack_slug: "midnight-velvet" } },
    data: {
      id: "order_abc",
      type: "orders",
      attributes: {
        user_email: "buyer@example.com",
        status: "paid",
        first_order_item: { variant_id: 777 },
      },
    },
  };

  it("extracts order, email, variant and claimed slug from a paid order_created event", () => {
    expect(parseOrderCreatedEvent(validEvent)).toEqual({
      orderId: "order_abc",
      email: "buyer@example.com",
      variantId: "777",
      claimedSlug: "midnight-velvet",
    });
  });

  it("returns null for events that aren't order_created", () => {
    expect(
      parseOrderCreatedEvent({
        ...validEvent,
        meta: { ...validEvent.meta, event_name: "subscription_created" },
      }),
    ).toBeNull();
  });

  it("returns null for unpaid orders (e.g. pending/refunded)", () => {
    expect(
      parseOrderCreatedEvent({
        ...validEvent,
        data: {
          ...validEvent.data,
          attributes: { ...validEvent.data.attributes, status: "pending" },
        },
      }),
    ).toBeNull();
  });

  it("still returns a paid order that has no custom_data.pack_slug", () => {
    expect(
      parseOrderCreatedEvent({
        ...validEvent,
        meta: { event_name: "order_created", custom_data: {} },
      }),
    ).toMatchObject({ orderId: "order_abc", variantId: "777", claimedSlug: null });
  });

  it("still returns a paid order that has no variant", () => {
    const { first_order_item: _drop, ...attributes } = validEvent.data.attributes;
    expect(
      parseOrderCreatedEvent({ ...validEvent, data: { ...validEvent.data, attributes } }),
    ).toMatchObject({ orderId: "order_abc", variantId: null });
  });

  it("returns null for malformed bodies", () => {
    expect(parseOrderCreatedEvent(null)).toBeNull();
    expect(parseOrderCreatedEvent({})).toBeNull();
    expect(parseOrderCreatedEvent("string")).toBeNull();
  });
});

describe("resolveOrderPack", () => {
  const catalog = buildCatalog([
    { slug: "midnight-velvet", name: "Midnight Velvet", lemonSqueezyVariantId: "777" },
    { slug: "solar-drift", name: "Solar Drift", lemonSqueezyVariantId: "888" },
  ]);
  const base = { orderId: "order_abc", email: "buyer@example.com" };

  it("delivers the pack of the purchased variant", () => {
    expect(
      resolveOrderPack(catalog, { ...base, variantId: "777", claimedSlug: "midnight-velvet" }),
    ).toEqual({
      ok: true,
      order: { ...base, packSlug: "midnight-velvet" },
    });
  });

  it("ignores a claimed slug that disagrees with the variant (tampered checkout URL)", () => {
    const result = resolveOrderPack(catalog, {
      ...base,
      variantId: "777",
      claimedSlug: "solar-drift",
    });
    expect(result).toMatchObject({ ok: true, order: { packSlug: "midnight-velvet" } });
  });

  it("delivers a paid order that carries no claimed slug", () => {
    expect(
      resolveOrderPack(catalog, { ...base, variantId: "888", claimedSlug: null }),
    ).toMatchObject({ ok: true, order: { packSlug: "solar-drift" } });
  });

  it("fails an unknown variant even when the claimed slug is a real pack", () => {
    expect(
      resolveOrderPack(catalog, { ...base, variantId: "999", claimedSlug: "solar-drift" }),
    ).toEqual({ ok: false, reason: "unknown_variant", orderId: "order_abc" });
  });

  it("fails a paid order without a variant", () => {
    expect(
      resolveOrderPack(catalog, { ...base, variantId: null, claimedSlug: "solar-drift" }),
    ).toEqual({ ok: false, reason: "missing_variant", orderId: "order_abc" });
  });
});
