// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  consumeDownload,
  extendDeadline,
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

    it("rejects as expired exactly at expiresAt, accepts one second earlier", async () => {
      await putOrder(backend, makeOrder({ expiresAt: NOW }));
      expect(await consumeDownload(backend, "order_abc", NOW)).toEqual({
        ok: false,
        reason: "expired",
      });
      expect(await consumeDownload(backend, "order_abc", NOW - 1)).toMatchObject({ ok: true });
    });

    it("is atomic: parallel consumes grant exactly the remaining allowance", async () => {
      await putOrder(backend, makeOrder({ downloadsRemaining: 3 }));
      const results = await Promise.all(
        Array.from({ length: 10 }, () => consumeDownload(backend, "order_abc", NOW)),
      );
      expect(results.filter((r) => r.ok)).toHaveLength(3);
      expect(results.filter((r) => !r.ok).every((r) => !r.ok && r.reason === "exhausted")).toBe(
        true,
      );
      expect((await getOrder(backend, "order_abc"))?.downloadsRemaining).toBe(0);
    });

    it("reports conflict when it keeps losing the write race", async () => {
      await putOrder(backend, makeOrder());
      const alwaysLoses: KVBackend = { ...backend, setIf: async () => false };
      expect(await consumeDownload(alwaysLoses, "order_abc", NOW)).toEqual({
        ok: false,
        reason: "conflict",
      });
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

  describe("extendDeadline", () => {
    it("pushes the deadline out and keeps everything else", async () => {
      await putOrder(backend, makeOrder({ expiresAt: NOW + 100, downloadsRemaining: 2 }));
      const result = await extendDeadline(backend, "order_abc", NOW, 500);
      expect(result).toMatchObject({ ok: true, order: { expiresAt: NOW + 500 } });
      expect(await getOrder(backend, "order_abc")).toEqual(
        makeOrder({ expiresAt: NOW + 500, downloadsRemaining: 2 }),
      );
    });

    it("never pulls the deadline in", async () => {
      await putOrder(backend, makeOrder({ expiresAt: FUTURE }));
      const result = await extendDeadline(backend, "order_abc", NOW, 500);
      expect(result).toMatchObject({ ok: true, order: { expiresAt: FUTURE } });
    });

    it("refuses expired, exhausted and unknown orders", async () => {
      await putOrder(backend, makeOrder({ orderId: "a", expiresAt: NOW }));
      await putOrder(backend, makeOrder({ orderId: "b", downloadsRemaining: 0 }));
      expect(await extendDeadline(backend, "a", NOW, 500)).toEqual({
        ok: false,
        reason: "expired",
      });
      expect(await extendDeadline(backend, "b", NOW, 500)).toEqual({
        ok: false,
        reason: "exhausted",
      });
      expect(await extendDeadline(backend, "c", NOW, 500)).toEqual({
        ok: false,
        reason: "not_found",
      });
    });

    it("does not lose a download consumed in parallel", async () => {
      await putOrder(backend, makeOrder({ expiresAt: NOW + 100, downloadsRemaining: 4 }));
      await Promise.all([
        extendDeadline(backend, "order_abc", NOW, 500),
        consumeDownload(backend, "order_abc", NOW),
        consumeDownload(backend, "order_abc", NOW),
      ]);
      const stored = await getOrder(backend, "order_abc");
      expect(stored?.downloadsRemaining).toBe(2);
      expect(stored?.expiresAt).toBe(NOW + 500);
    });
  });

  describe("inMemoryBackend compare-and-set", () => {
    it("setIf(null) only creates, setIf(version) only updates the version it saw", async () => {
      expect(await backend.setIf("k", "v1", null)).toBe(true);
      expect(await backend.setIf("k", "other", null)).toBe(false);
      const seen = await backend.getVersioned("k");
      expect(seen?.value).toBe("v1");
      expect(await backend.setIf("k", "v2", seen!.version)).toBe(true);
      expect(await backend.setIf("k", "v3", seen!.version)).toBe(false); // stale version
      expect(await backend.get("k")).toBe("v2");
    });
  });
});
