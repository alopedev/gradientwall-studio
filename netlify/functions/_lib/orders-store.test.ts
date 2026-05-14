// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  consumeDownload,
  getOrder,
  getOrderByLsOrderId,
  inMemoryBackend,
  putLsOrderPointer,
  putOrder,
  type OrderRecord,
  type KVBackend,
} from "./orders-store";

const NOW = 1_700_000_000; // arbitrary epoch seconds, well-defined "now" for tests
const FUTURE = NOW + 60 * 60 * 24 * 30; // 30 days
const PAST = NOW - 60 * 60 * 24;

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    orderId: "uuid-abc",
    lsOrderId: "ls_order_abc",
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

  it("round-trips an order via put + get (keyed by our orderId)", async () => {
    const o = makeOrder();
    await putOrder(backend, o);
    expect(await getOrder(backend, o.orderId)).toEqual(o);
  });

  it("stores orders under the `order:` namespace", async () => {
    const o = makeOrder();
    await putOrder(backend, o);
    // Raw read at the namespaced key must succeed; raw read at the bare id
    // must miss — guards against accidentally writing to the wrong namespace.
    expect(await backend.get(`order:${o.orderId}`)).not.toBeNull();
    expect(await backend.get(o.orderId)).toBeNull();
  });

  it("returns null for unknown orders", async () => {
    expect(await getOrder(backend, "nope")).toBeNull();
  });

  it("returns null when stored value is corrupt JSON", async () => {
    await backend.set("order:bad", "not-json");
    expect(await getOrder(backend, "bad")).toBeNull();
  });

  describe("lsOrderId pointer", () => {
    it("resolves an Order via its ls pointer", async () => {
      const o = makeOrder();
      await putOrder(backend, o);
      await putLsOrderPointer(backend, o.lsOrderId, o.orderId);
      expect(await getOrderByLsOrderId(backend, o.lsOrderId)).toEqual(o);
    });

    it("returns null when the pointer is missing", async () => {
      await putOrder(backend, makeOrder());
      expect(await getOrderByLsOrderId(backend, "ls_ghost")).toBeNull();
    });

    it("returns null when the pointer is corrupt JSON", async () => {
      await backend.set("ls:ls_bad", "not-json");
      expect(await getOrderByLsOrderId(backend, "ls_bad")).toBeNull();
    });

    it("returns null when the pointer targets a missing Order (orphan)", async () => {
      await putLsOrderPointer(backend, "ls_orphan", "uuid-never-written");
      expect(await getOrderByLsOrderId(backend, "ls_orphan")).toBeNull();
    });

    it("stores pointers under the `ls:` namespace, disjoint from `order:`", async () => {
      await putLsOrderPointer(backend, "ls_x", "uuid-x");
      expect(await backend.get("ls:ls_x")).not.toBeNull();
      // A pointer at `ls:ls_x` must never be readable as an order at `order:ls_x`.
      expect(await getOrder(backend, "ls_x")).toBeNull();
    });
  });

  describe("consumeDownload", () => {
    it("decrements the counter on success", async () => {
      await putOrder(backend, makeOrder({ downloadsRemaining: 5 }));
      const result = await consumeDownload(backend, "uuid-abc", NOW);
      expect(result).toEqual({ ok: true, remaining: 4 });
      const stored = await getOrder(backend, "uuid-abc");
      expect(stored?.downloadsRemaining).toBe(4);
    });

    it("rejects with not_found when the order doesn't exist", async () => {
      const result = await consumeDownload(backend, "missing", NOW);
      expect(result).toEqual({ ok: false, reason: "not_found" });
    });

    it("rejects with expired when the order's expiresAt has passed", async () => {
      await putOrder(backend, makeOrder({ expiresAt: PAST }));
      const result = await consumeDownload(backend, "uuid-abc", NOW);
      expect(result).toEqual({ ok: false, reason: "expired" });
    });

    it("rejects with exhausted when the counter is at zero", async () => {
      await putOrder(backend, makeOrder({ downloadsRemaining: 0 }));
      const result = await consumeDownload(backend, "uuid-abc", NOW);
      expect(result).toEqual({ ok: false, reason: "exhausted" });
    });

    it("permits exactly downloadsRemaining successful consumes in sequence", async () => {
      await putOrder(backend, makeOrder({ downloadsRemaining: 3 }));
      const r1 = await consumeDownload(backend, "uuid-abc", NOW);
      const r2 = await consumeDownload(backend, "uuid-abc", NOW);
      const r3 = await consumeDownload(backend, "uuid-abc", NOW);
      const r4 = await consumeDownload(backend, "uuid-abc", NOW);
      expect([r1, r2, r3]).toEqual([
        { ok: true, remaining: 2 },
        { ok: true, remaining: 1 },
        { ok: true, remaining: 0 },
      ]);
      expect(r4).toEqual({ ok: false, reason: "exhausted" });
    });
  });
});
