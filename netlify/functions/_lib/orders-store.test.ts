// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  consumeDownload,
  getOrder,
  inMemoryBackend,
  putOrder,
  type OrderRecord,
  type KVBackend,
} from "./orders-store";

const NOW = 1_700_000_000; // arbitrary epoch seconds, well-defined "now" for tests
const FUTURE = NOW + 60 * 60 * 24 * 30; // 30 days
const PAST = NOW - 60 * 60 * 24;

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    orderId: "order_abc",
    packSlug: "midnight-velvet",
    email: "buyer@example.com",
    downloadsRemaining: 5,
    expiresAt: FUTURE,
    createdAt: NOW,
    ...overrides,
  };
}

describe("orders-store", () => {
  let backend: KVBackend;
  beforeEach(() => {
    backend = inMemoryBackend();
  });

  it("round-trips an order via put + get", async () => {
    const o = makeOrder();
    await putOrder(backend, o);
    expect(await getOrder(backend, o.orderId)).toEqual(o);
  });

  it("returns null for unknown orders", async () => {
    expect(await getOrder(backend, "nope")).toBeNull();
  });

  it("returns null when stored value is corrupt JSON", async () => {
    await backend.set("bad", "not-json");
    expect(await getOrder(backend, "bad")).toBeNull();
  });

  describe("consumeDownload", () => {
    it("decrements the counter on success", async () => {
      await putOrder(backend, makeOrder({ downloadsRemaining: 5 }));
      const result = await consumeDownload(backend, "order_abc", NOW);
      expect(result).toEqual({ ok: true, remaining: 4 });
      const stored = await getOrder(backend, "order_abc");
      expect(stored?.downloadsRemaining).toBe(4);
    });

    it("rejects with not_found when the order doesn't exist", async () => {
      const result = await consumeDownload(backend, "missing", NOW);
      expect(result).toEqual({ ok: false, reason: "not_found" });
    });

    it("rejects with expired when the order's expiresAt has passed", async () => {
      await putOrder(backend, makeOrder({ expiresAt: PAST }));
      const result = await consumeDownload(backend, "order_abc", NOW);
      expect(result).toEqual({ ok: false, reason: "expired" });
    });

    it("rejects with exhausted when the counter is at zero", async () => {
      await putOrder(backend, makeOrder({ downloadsRemaining: 0 }));
      const result = await consumeDownload(backend, "order_abc", NOW);
      expect(result).toEqual({ ok: false, reason: "exhausted" });
    });

    it("permits exactly downloadsRemaining successful consumes in sequence", async () => {
      await putOrder(backend, makeOrder({ downloadsRemaining: 3 }));
      const r1 = await consumeDownload(backend, "order_abc", NOW);
      const r2 = await consumeDownload(backend, "order_abc", NOW);
      const r3 = await consumeDownload(backend, "order_abc", NOW);
      const r4 = await consumeDownload(backend, "order_abc", NOW);
      expect([r1, r2, r3]).toEqual([
        { ok: true, remaining: 2 },
        { ok: true, remaining: 1 },
        { ok: true, remaining: 0 },
      ]);
      expect(r4).toEqual({ ok: false, reason: "exhausted" });
    });
  });
});
