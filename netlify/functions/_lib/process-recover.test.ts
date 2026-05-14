// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { processRecover, type ProcessRecoverDeps } from "./process-recover";
import {
  getOrder,
  putLsOrderPointer,
  putOrder,
  inMemoryBackend,
  type KVBackend,
  type OrderRecord,
} from "./orders-store";
import { verifyDownloadToken } from "./signed-token";
import type { LoopsClient } from "./loops";

const NOW = Math.floor(Date.now() / 1000);
const SECRET = "test-jwt-secret-32-chars-padding-ok";
const TTL = 60 * 60 * 24 * 7;

function fakeLoops(): LoopsClient & {
  sent: Array<Parameters<LoopsClient["sendTransactional"]>[0]>;
} {
  const sent: Array<Parameters<LoopsClient["sendTransactional"]>[0]> = [];
  return {
    sent,
    sendTransactional: vi.fn(async (opts) => {
      sent.push(opts);
    }),
    addContact: vi.fn(async () => {}),
  };
}

const baseOrder: OrderRecord = {
  orderId: "uuid-xyz",
  lsOrderId: "ls_order_xyz",
  packSlug: "midnight-velvet",
  email: "buyer@example.com",
  downloadsRemaining: 4,
  expiresAt: NOW + 1000,
  createdAt: NOW - 5000,
};

describe("processRecover", () => {
  let store: KVBackend;
  let loops: ReturnType<typeof fakeLoops>;
  let lookupCalls: string[];

  beforeEach(async () => {
    store = inMemoryBackend();
    loops = fakeLoops();
    lookupCalls = [];
    await putOrder(store, baseOrder);
    await putLsOrderPointer(store, baseOrder.lsOrderId, baseOrder.orderId);
  });

  function deps(over: Partial<ProcessRecoverDeps> = {}): ProcessRecoverDeps {
    return {
      store,
      loops,
      lookupOrderEmail: async (lsOrderId) => {
        lookupCalls.push(lsOrderId);
        return { email: baseOrder.email };
      },
      jwtSecret: SECRET,
      loopsTransactionalId: "tpl_123",
      publicSiteUrl: "https://gradientwall.com",
      now: () => NOW,
      ...over,
    };
  }

  it("bad_input — empty email/lsOrderId after trim", async () => {
    const r1 = await processRecover(deps(), { email: "  ", lsOrderId: "ls_order_xyz" });
    const r2 = await processRecover(deps(), { email: "buyer@example.com", lsOrderId: "  " });
    expect(r1).toEqual({ ok: true, reason: "bad_input" });
    expect(r2).toEqual({ ok: true, reason: "bad_input" });
    expect(lookupCalls).toEqual([]); // never called
    expect(loops.sent).toHaveLength(0);
  });

  it("order_not_found — missing pointer; lookup never called", async () => {
    const out = await processRecover(deps(), {
      email: "buyer@example.com",
      lsOrderId: "ls_ghost",
    });
    expect(out).toEqual({ ok: true, reason: "order_not_found" });
    expect(lookupCalls).toEqual([]);
    expect(loops.sent).toHaveLength(0);
  });

  it("order_not_found — passing our internal orderId is rejected (lookup is ls-only)", async () => {
    // Defence in depth: a caller who somehow learnt our internal UUID still
    // can't recover with it — the pointer is keyed by the LS id.
    const out = await processRecover(deps(), {
      email: "buyer@example.com",
      lsOrderId: baseOrder.orderId,
    });
    expect(out).toEqual({ ok: true, reason: "order_not_found" });
  });

  it("ls_lookup_failed — lookup returns null (404 upstream)", async () => {
    const out = await processRecover(
      deps({ lookupOrderEmail: async () => null }),
      { email: "buyer@example.com", lsOrderId: "ls_order_xyz" },
    );
    expect(out).toEqual({ ok: true, reason: "ls_lookup_failed" });
    expect(loops.sent).toHaveLength(0);
  });

  it("ls_lookup_failed — lookup throws (timeout / network) is captured defensively", async () => {
    const out = await processRecover(
      deps({
        lookupOrderEmail: async () => {
          throw new Error("ETIMEDOUT");
        },
      }),
      { email: "buyer@example.com", lsOrderId: "ls_order_xyz" },
    );
    expect(out).toEqual({ ok: true, reason: "ls_lookup_failed" });
    expect(loops.sent).toHaveLength(0);
  });

  it("email_mismatch — input vs LS differ", async () => {
    const out = await processRecover(deps(), {
      email: "someone-else@example.com",
      lsOrderId: "ls_order_xyz",
    });
    expect(out).toEqual({ ok: true, reason: "email_mismatch" });
    expect(loops.sent).toHaveLength(0);
  });

  it("email_mismatch — case + whitespace normalised on both sides", async () => {
    const out = await processRecover(
      deps({ lookupOrderEmail: async () => ({ email: "  BUYER@Example.COM  " }) }),
      { email: "  Buyer@example.com  ", lsOrderId: "ls_order_xyz" },
    );
    expect(out).toMatchObject({ ok: true, reason: "reissued" });
  });

  it("reissued — token decodes to stored payload (our orderId, not lsOrderId), exp aligned with store expiresAt", async () => {
    const out = await processRecover(deps(), {
      email: "buyer@example.com",
      lsOrderId: "ls_order_xyz",
    });
    expect(out).toEqual({ ok: true, reason: "reissued", expiresAt: NOW + TTL });

    const stored = await getOrder(store, baseOrder.orderId);
    expect(stored?.expiresAt).toBe(NOW + TTL);

    const sent = loops.sent[0];
    const url = new URL(sent.dataVariables.downloadUrl);
    const token = url.searchParams.get("token");
    expect(token).toBeTruthy();
    const verified = await verifyDownloadToken(token!, SECRET);
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.payload).toEqual({
        orderId: baseOrder.orderId,
        packSlug: baseOrder.packSlug,
        email: baseOrder.email,
      });
      expect(JSON.stringify(verified.payload)).not.toContain(baseOrder.lsOrderId);
    }
  });

  it("forwards the lsOrderId to lookupOrderEmail (LS API speaks LS ids)", async () => {
    await processRecover(deps(), {
      email: "buyer@example.com",
      lsOrderId: "ls_order_xyz",
    });
    expect(lookupCalls).toEqual(["ls_order_xyz"]);
  });

  it("reissued preserves downloadsRemaining and createdAt (vs processOrderCreated which resets)", async () => {
    await processRecover(deps(), { email: "buyer@example.com", lsOrderId: "ls_order_xyz" });
    const stored = await getOrder(store, baseOrder.orderId);
    expect(stored?.downloadsRemaining).toBe(baseOrder.downloadsRemaining);
    expect(stored?.createdAt).toBe(baseOrder.createdAt);
  });

  it("idempotency — two recovers in a row issue distinct tokens, counter unchanged", async () => {
    await processRecover(deps(), { email: "buyer@example.com", lsOrderId: "ls_order_xyz" });
    await processRecover(
      deps({ now: () => NOW + 1 }),
      { email: "buyer@example.com", lsOrderId: "ls_order_xyz" },
    );
    const t1 = new URL(loops.sent[0].dataVariables.downloadUrl).searchParams.get("token");
    const t2 = new URL(loops.sent[1].dataVariables.downloadUrl).searchParams.get("token");
    expect(t1).not.toEqual(t2);
    const stored = await getOrder(store, baseOrder.orderId);
    expect(stored?.downloadsRemaining).toBe(baseOrder.downloadsRemaining);
    expect(stored?.createdAt).toBe(baseOrder.createdAt);
  });

  it("anti-enumeration shape — all silent failure outcomes are indistinguishable to a caller that only reads `ok`", async () => {
    const cases = await Promise.all([
      processRecover(deps(), { email: "", lsOrderId: "" }),
      processRecover(deps(), { email: "x@y.z", lsOrderId: "ls_ghost" }),
      processRecover(
        deps({ lookupOrderEmail: async () => null }),
        { email: "buyer@example.com", lsOrderId: "ls_order_xyz" },
      ),
      processRecover(deps(), { email: "wrong@example.com", lsOrderId: "ls_order_xyz" }),
    ]);
    for (const c of cases) {
      expect(c.ok).toBe(true);
      expect(c).not.toHaveProperty("expiresAt");
    }
    expect(loops.sent).toHaveLength(0);
  });

  it("emails the buyer at stored.email (not the LS lookup email) for receipt-history consistency", async () => {
    await processRecover(
      deps({ lookupOrderEmail: async () => ({ email: "BUYER@Example.com" }) }),
      { email: "buyer@example.com", lsOrderId: "ls_order_xyz" },
    );
    expect(loops.sent[0].email).toBe(baseOrder.email);
  });

  it("preserves downloadsRemaining when /download decrements concurrently between getOrder and putOrder", async () => {
    // Race shape: simulate /download consuming a token between our initial
    // read and our write. The fresh re-read inside processRecover should
    // pick up the decremented value rather than overwrite it from the stale read.
    const racingStore: KVBackend = {
      get: store.get,
      set: store.set,
    };
    const lookupOrderEmail = async () => {
      // Right after the initial getOrderByLsOrderId, before putOrder, simulate /download.
      const current = await getOrder(store, baseOrder.orderId);
      if (current) {
        await putOrder(store, { ...current, downloadsRemaining: current.downloadsRemaining - 1 });
      }
      return { email: baseOrder.email };
    };

    await processRecover(deps({ store: racingStore, lookupOrderEmail }), {
      email: "buyer@example.com",
      lsOrderId: "ls_order_xyz",
    });

    const after = await getOrder(store, baseOrder.orderId);
    expect(after?.downloadsRemaining).toBe(baseOrder.downloadsRemaining - 1);
    expect(after?.expiresAt).toBe(NOW + TTL);
  });
});
