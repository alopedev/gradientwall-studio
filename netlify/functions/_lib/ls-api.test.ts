// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { fetchOrderEmail } from "./ls-api";

function mockFetch(status: number, body: unknown) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/vnd.api+json" },
      }),
  );
}

const validBody = {
  data: {
    id: "order_abc",
    type: "orders",
    attributes: { user_email: "buyer@example.com" },
  },
};

describe("fetchOrderEmail", () => {
  it("returns the email for a 200 response with the expected shape", async () => {
    const fetchImpl = mockFetch(200, validBody);
    const result = await fetchOrderEmail("order_abc", "key", fetchImpl);
    expect(result).toEqual({ orderId: "order_abc", email: "buyer@example.com" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.lemonsqueezy.com/v1/orders/order_abc",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer key" }),
      }),
    );
  });

  it("returns null on 404", async () => {
    const result = await fetchOrderEmail("nope", "key", mockFetch(404, {}));
    expect(result).toBeNull();
  });

  it("throws on non-2xx, non-404 (network/server error — caller catches)", async () => {
    const fetchImpl = mockFetch(500, { error: "boom" });
    await expect(fetchOrderEmail("x", "key", fetchImpl)).rejects.toThrow(/LS getOrder failed: 500/);
  });

  it("returns null when the body shape is unexpected", async () => {
    const result = await fetchOrderEmail("x", "key", mockFetch(200, { hello: "world" }));
    expect(result).toBeNull();
  });

  it("URL-encodes the orderId", async () => {
    const fetchImpl = mockFetch(200, validBody);
    await fetchOrderEmail("order/with space", "key", fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.lemonsqueezy.com/v1/orders/order%2Fwith%20space",
      expect.any(Object),
    );
  });
});
