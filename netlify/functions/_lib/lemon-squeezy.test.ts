// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { parseOrderCreatedEvent, verifyWebhookSignature } from "./lemon-squeezy";

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
      attributes: { user_email: "buyer@example.com", status: "paid" },
    },
  };

  it("extracts order/email/packSlug from a valid order_created paid event", () => {
    expect(parseOrderCreatedEvent(validEvent)).toEqual({
      orderId: "order_abc",
      email: "buyer@example.com",
      packSlug: "midnight-velvet",
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
        data: { ...validEvent.data, attributes: { ...validEvent.data.attributes, status: "pending" } },
      }),
    ).toBeNull();
  });

  it("returns null when custom_data.pack_slug is missing", () => {
    expect(
      parseOrderCreatedEvent({
        ...validEvent,
        meta: { event_name: "order_created", custom_data: {} },
      }),
    ).toBeNull();
  });

  it("returns null for malformed bodies", () => {
    expect(parseOrderCreatedEvent(null)).toBeNull();
    expect(parseOrderCreatedEvent({})).toBeNull();
    expect(parseOrderCreatedEvent("string")).toBeNull();
  });
});
