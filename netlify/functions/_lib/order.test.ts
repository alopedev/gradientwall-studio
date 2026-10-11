// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { decodeJwt } from "jose";
import { createOrder, recoverOrder, redeemDownload, type RecoverOrderDeps } from "./order";
import {
  getOrder,
  inMemoryBackend,
  putOrder,
  type KVBackend,
  type OrderRecord,
} from "./orders-store";
import { issueDownloadToken, verifyDownloadToken } from "./signed-token";
import type { LoopsClient } from "./loops";

// Use the real wall-clock so jose's exp validation (which reads the real
// system clock) accepts JWTs we issue here. The relative invariants we test
// (createdAt = NOW, expiresAt = NOW + ttl) hold within the test process.
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
  };
}

describe("createOrder", () => {
  let store: KVBackend;
  let loops: ReturnType<typeof fakeLoops>;

  beforeEach(() => {
    store = inMemoryBackend();
    loops = fakeLoops();
  });

  const baseInput = {
    orderId: "order_xyz",
    packSlug: "midnight-velvet",
    email: "buyer@example.com",
  };
  const baseDeps = () => ({
    store,
    loops,
    jwtSecret: SECRET,
    loopsTransactionalId: "tpl_123",
    publicSiteUrl: "https://gradientwall.com",
    now: () => NOW,
  });

  it("persists the order with 5 downloads and the expected expiration", async () => {
    await createOrder(baseDeps(), baseInput);
    const stored = await getOrder(store, "order_xyz");
    expect(stored).toMatchObject({
      orderId: "order_xyz",
      packSlug: "midnight-velvet",
      email: "buyer@example.com",
      downloadsRemaining: 5,
      createdAt: NOW,
      expiresAt: NOW + 60 * 60 * 24 * 30,
    });
  });

  it("issues a JWT that decodes back to the order payload", async () => {
    await createOrder(baseDeps(), baseInput);
    const sent = loops.sent[0];
    const url = new URL(sent.dataVariables.downloadUrl);
    const token = url.searchParams.get("token");
    expect(token).toBeTruthy();
    const result = await verifyDownloadToken(token!, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload).toEqual(baseInput);
  });

  it("sends the transactional email with packName + downloadUrl variables", async () => {
    await createOrder(baseDeps(), baseInput);
    expect(loops.sent).toHaveLength(1);
    expect(loops.sent[0]).toMatchObject({
      transactionalId: "tpl_123",
      email: "buyer@example.com",
      dataVariables: { packName: "midnight-velvet" },
    });
    expect(loops.sent[0].dataVariables.downloadUrl).toMatch(
      /^https:\/\/gradientwall\.com\/\.netlify\/functions\/download\?token=/,
    );
  });

  it("emails the pack's display name when the catalog knows it", async () => {
    await createOrder(
      {
        ...baseDeps(),
        packNameOf: (slug) => (slug === "midnight-velvet" ? "Midnight Velvet" : undefined),
      },
      baseInput,
    );
    expect(loops.sent[0].dataVariables.packName).toBe("Midnight Velvet");
  });

  it("re-issues a fresh token when the same order is processed twice (LS retry)", async () => {
    await createOrder(baseDeps(), baseInput);
    const firstUrl = loops.sent[0].dataVariables.downloadUrl;
    // simulate LS retry 1 second later
    await createOrder({ ...baseDeps(), now: () => NOW + 1 }, baseInput);
    const secondUrl = loops.sent[1].dataVariables.downloadUrl;
    expect(firstUrl).not.toEqual(secondUrl); // tokens differ (issuedAt differs)
    const stored = await getOrder(store, "order_xyz");
    expect(stored?.downloadsRemaining).toBe(5); // counter reset, not stacked
  });

  it("respects ttlSeconds and downloadsAllowed overrides (used by /recover)", async () => {
    await createOrder(
      { ...baseDeps(), ttlSeconds: 60 * 60 * 24 * 7, downloadsAllowed: 3 },
      baseInput,
    );
    const stored = await getOrder(store, "order_xyz");
    expect(stored?.downloadsRemaining).toBe(3);
    expect(stored?.expiresAt).toBe(NOW + 60 * 60 * 24 * 7);
  });
});

const ORDER = {
  orderId: "order_123",
  packSlug: "midnight-velvet",
  email: "buyer@example.com",
};

const baseOrder: OrderRecord = {
  orderId: "order_xyz",
  packSlug: "midnight-velvet",
  email: "buyer@example.com",
  downloadsRemaining: 4,
  expiresAt: NOW + 1000,
  createdAt: NOW - 5000,
};

describe("recoverOrder", () => {
  let store: KVBackend;
  let loops: ReturnType<typeof fakeLoops>;
  let lookupCalls: string[];

  beforeEach(async () => {
    store = inMemoryBackend();
    loops = fakeLoops();
    lookupCalls = [];
    await putOrder(store, baseOrder);
  });

  function deps(over: Partial<RecoverOrderDeps> = {}): RecoverOrderDeps {
    return {
      store,
      loops,
      lookupOrderEmail: async (orderId) => {
        lookupCalls.push(orderId);
        return { email: baseOrder.email };
      },
      jwtSecret: SECRET,
      loopsTransactionalId: "tpl_123",
      publicSiteUrl: "https://gradientwall.com",
      now: () => NOW,
      ...over,
    };
  }

  it("bad_input — empty email/orderId after trim", async () => {
    const r1 = await recoverOrder(deps(), { email: "  ", orderId: "order_xyz" });
    const r2 = await recoverOrder(deps(), { email: "buyer@example.com", orderId: "  " });
    expect(r1).toEqual({ ok: true, reason: "bad_input" });
    expect(r2).toEqual({ ok: true, reason: "bad_input" });
    expect(lookupCalls).toEqual([]); // never called
    expect(loops.sent).toHaveLength(0);
  });

  it("order_not_found — missing in store; lookup never called", async () => {
    const out = await recoverOrder(deps(), {
      email: "buyer@example.com",
      orderId: "ghost_order",
    });
    expect(out).toEqual({ ok: true, reason: "order_not_found" });
    expect(lookupCalls).toEqual([]);
    expect(loops.sent).toHaveLength(0);
  });

  it("ls_lookup_failed — lookup returns null (404 upstream)", async () => {
    const out = await recoverOrder(deps({ lookupOrderEmail: async () => null }), {
      email: "buyer@example.com",
      orderId: "order_xyz",
    });
    expect(out).toEqual({ ok: true, reason: "ls_lookup_failed" });
    expect(loops.sent).toHaveLength(0);
  });

  it("ls_lookup_failed — lookup throws (timeout / network) is captured defensively", async () => {
    const out = await recoverOrder(
      deps({
        lookupOrderEmail: async () => {
          throw new Error("ETIMEDOUT");
        },
      }),
      { email: "buyer@example.com", orderId: "order_xyz" },
    );
    expect(out).toEqual({ ok: true, reason: "ls_lookup_failed" });
    expect(loops.sent).toHaveLength(0);
  });

  it("email_mismatch — input vs LS differ", async () => {
    const out = await recoverOrder(deps(), {
      email: "someone-else@example.com",
      orderId: "order_xyz",
    });
    expect(out).toEqual({ ok: true, reason: "email_mismatch" });
    expect(loops.sent).toHaveLength(0);
  });

  it("email_mismatch — case + whitespace normalised on both sides", async () => {
    const out = await recoverOrder(
      deps({ lookupOrderEmail: async () => ({ email: "  BUYER@Example.COM  " }) }),
      { email: "  Buyer@example.com  ", orderId: "order_xyz" },
    );
    expect(out).toMatchObject({ ok: true, reason: "reissued" });
  });

  it("reissued — token decodes to stored payload, exp aligned with store expiresAt", async () => {
    const out = await recoverOrder(deps(), {
      email: "buyer@example.com",
      orderId: "order_xyz",
    });
    expect(out).toEqual({ ok: true, reason: "reissued", expiresAt: NOW + TTL });

    const stored = await getOrder(store, "order_xyz");
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
    }
  });

  it("reissued preserves downloadsRemaining and createdAt (vs processOrderCreated which resets)", async () => {
    await recoverOrder(deps(), { email: "buyer@example.com", orderId: "order_xyz" });
    const stored = await getOrder(store, "order_xyz");
    expect(stored?.downloadsRemaining).toBe(baseOrder.downloadsRemaining);
    expect(stored?.createdAt).toBe(baseOrder.createdAt);
  });

  it("idempotency — two recovers in a row issue distinct tokens, counter unchanged", async () => {
    await recoverOrder(deps(), { email: "buyer@example.com", orderId: "order_xyz" });
    await recoverOrder(deps({ now: () => NOW + 1 }), {
      email: "buyer@example.com",
      orderId: "order_xyz",
    });
    const t1 = new URL(loops.sent[0].dataVariables.downloadUrl).searchParams.get("token");
    const t2 = new URL(loops.sent[1].dataVariables.downloadUrl).searchParams.get("token");
    expect(t1).not.toEqual(t2);
    const stored = await getOrder(store, "order_xyz");
    expect(stored?.downloadsRemaining).toBe(baseOrder.downloadsRemaining);
    expect(stored?.createdAt).toBe(baseOrder.createdAt);
  });

  it("anti-enumeration shape — all silent failure outcomes are indistinguishable to a caller that only reads `ok`", async () => {
    const cases = await Promise.all([
      recoverOrder(deps(), { email: "", orderId: "" }),
      recoverOrder(deps(), { email: "x@y.z", orderId: "ghost" }),
      recoverOrder(deps({ lookupOrderEmail: async () => null }), {
        email: "buyer@example.com",
        orderId: "order_xyz",
      }),
      recoverOrder(deps(), { email: "wrong@example.com", orderId: "order_xyz" }),
    ]);
    for (const c of cases) {
      expect(c.ok).toBe(true);
      expect(c).not.toHaveProperty("expiresAt");
    }
    expect(loops.sent).toHaveLength(0);
  });

  it("emails the buyer at stored.email (not the LS lookup email) for receipt-history consistency", async () => {
    await recoverOrder(deps({ lookupOrderEmail: async () => ({ email: "BUYER@Example.com" }) }), {
      email: "buyer@example.com",
      orderId: "order_xyz",
    });
    expect(loops.sent[0].email).toBe(baseOrder.email);
  });

  it("never shortens the Deadline — recovery on a 29d-fresh order keeps the original expiresAt", async () => {
    const twentyNineDays = 60 * 60 * 24 * 29;
    const longDeadline = NOW + twentyNineDays;
    await putOrder(store, { ...baseOrder, expiresAt: longDeadline });

    const out = await recoverOrder(deps(), {
      email: "buyer@example.com",
      orderId: "order_xyz",
    });

    expect(out).toMatchObject({ ok: true, reason: "reissued", expiresAt: longDeadline });
    const stored = await getOrder(store, "order_xyz");
    expect(stored?.expiresAt).toBe(longDeadline);
    // counter still 4 (recovery doesn't reset)
    expect(stored?.downloadsRemaining).toBe(baseOrder.downloadsRemaining);
  });

  it("JWT exp aligns with stored expiresAt when deadline is preserved (not the default 7d ttl)", async () => {
    const twentyNineDays = 60 * 60 * 24 * 29;
    const longDeadline = NOW + twentyNineDays;
    await putOrder(store, { ...baseOrder, expiresAt: longDeadline });

    await recoverOrder(deps(), {
      email: "buyer@example.com",
      orderId: "order_xyz",
    });

    const token = new URL(loops.sent[0].dataVariables.downloadUrl).searchParams.get("token");
    const decoded = decodeJwt(token!);
    // JWT exp must align with the store Deadline (not the default 7d ttl);
    // otherwise the token expires while the Order is still valid.
    expect(decoded.exp).toBe(longDeadline);
  });

  it("extends the Deadline when stored expiresAt is closer than now + ttl", async () => {
    // baseOrder.expiresAt = NOW + 1000 (close); ttl default = 7d → recovery extends to NOW + 7d
    const out = await recoverOrder(deps(), {
      email: "buyer@example.com",
      orderId: "order_xyz",
    });
    expect(out).toMatchObject({ ok: true, reason: "reissued", expiresAt: NOW + TTL });
    const stored = await getOrder(store, "order_xyz");
    expect(stored?.expiresAt).toBe(NOW + TTL);
  });

  it("expired — Order whose Deadline already passed; rejected before LS lookup", async () => {
    await putOrder(store, { ...baseOrder, expiresAt: NOW - 1 });
    const out = await recoverOrder(deps(), {
      email: "buyer@example.com",
      orderId: "order_xyz",
    });
    expect(out).toEqual({ ok: true, reason: "expired" });
    expect(loops.sent).toHaveLength(0);
    expect(lookupCalls).toEqual([]); // no upstream call wasted
  });

  it("exhausted — Order with downloadsRemaining=0; rejected before LS lookup", async () => {
    await putOrder(store, { ...baseOrder, downloadsRemaining: 0 });
    const out = await recoverOrder(deps(), {
      email: "buyer@example.com",
      orderId: "order_xyz",
    });
    expect(out).toEqual({ ok: true, reason: "exhausted" });
    expect(loops.sent).toHaveLength(0);
    expect(lookupCalls).toEqual([]);
  });

  it("preserves downloadsRemaining when /download decrements concurrently between getOrder and putOrder", async () => {
    // Race shape: simulate /download consuming a token between our initial
    // read and our write. The compare-and-set inside recoverOrder must pick up
    // the decremented value rather than overwrite it from the stale read.
    const lookupOrderEmail = async () => {
      // Right after the initial getOrder, before putOrder, simulate /download.
      const current = await getOrder(store, "order_xyz");
      if (current) {
        await putOrder(store, { ...current, downloadsRemaining: current.downloadsRemaining - 1 });
      }
      return { email: baseOrder.email };
    };

    await recoverOrder(deps({ lookupOrderEmail }), {
      email: "buyer@example.com",
      orderId: "order_xyz",
    });

    const after = await getOrder(store, "order_xyz");
    expect(after?.downloadsRemaining).toBe(baseOrder.downloadsRemaining - 1);
    expect(after?.expiresAt).toBe(NOW + TTL);
  });
});

describe("expiry boundary (recover and download agree)", () => {
  it("at now === expiresAt both refuse: no link that /download would reject", async () => {
    const store = inMemoryBackend();
    const loops = fakeLoops();
    await putOrder(store, { ...baseOrder, orderId: ORDER.orderId, expiresAt: NOW });

    const recovered = await recoverOrder(
      {
        store,
        loops,
        lookupOrderEmail: async () => ({ email: baseOrder.email }),
        jwtSecret: SECRET,
        loopsTransactionalId: "tpl_123",
        publicSiteUrl: "https://gradientwall.com",
        now: () => NOW,
      },
      { email: baseOrder.email, orderId: ORDER.orderId },
    );
    expect(recovered).toEqual({ ok: true, reason: "expired" });
    expect(loops.sent).toHaveLength(0);

    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });
    const redeemed = await redeemDownload(
      { store, jwtSecret: SECRET, presign: async () => "https://r2.example.com/x", now: () => NOW },
      token,
    );
    expect(redeemed).toEqual({ ok: false, status: 403, reason: "expired_order" });
  });

  it("one second before expiresAt both still accept", async () => {
    const store = inMemoryBackend();
    const loops = fakeLoops();
    await putOrder(store, { ...baseOrder, orderId: ORDER.orderId, expiresAt: NOW + 1 });

    const recovered = await recoverOrder(
      {
        store,
        loops,
        lookupOrderEmail: async () => ({ email: baseOrder.email }),
        jwtSecret: SECRET,
        loopsTransactionalId: "tpl_123",
        publicSiteUrl: "https://gradientwall.com",
        now: () => NOW,
      },
      { email: baseOrder.email, orderId: ORDER.orderId },
    );
    expect(recovered).toMatchObject({ ok: true, reason: "reissued" });

    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });
    const redeemed = await redeemDownload(
      { store, jwtSecret: SECRET, presign: async () => "https://r2.example.com/x", now: () => NOW },
      token,
    );
    expect(redeemed.ok).toBe(true);
  });
});

describe("redeemDownload", () => {
  let store: KVBackend;
  let presign: (slug: string) => Promise<string>;
  let presignCalls: string[];

  beforeEach(() => {
    store = inMemoryBackend();
    presignCalls = [];
    presign = vi.fn(async (slug: string): Promise<string> => {
      presignCalls.push(slug);
      return `https://r2.example.com/${slug}.zip?sig=xyz`;
    });
  });

  const dlDeps = () => ({ store, jwtSecret: SECRET, presign, now: () => NOW });

  it("rejects a missing token with 401 invalid_token", async () => {
    expect(await redeemDownload(dlDeps(), null)).toEqual({
      ok: false,
      status: 401,
      reason: "invalid_token",
    });
  });

  it("rejects a token signed with a different secret as 401 invalid_token", async () => {
    const token = await issueDownloadToken({
      payload: ORDER,
      ttlSeconds: 60,
      secret: "different-secret-padding",
    });
    const result = await redeemDownload(dlDeps(), token);
    expect(result).toEqual({ ok: false, status: 401, reason: "invalid_token" });
  });

  it("rejects an expired token as 401 expired_token", async () => {
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: -1, secret: SECRET });
    const result = await redeemDownload(dlDeps(), token);
    expect(result).toEqual({ ok: false, status: 401, reason: "expired_token" });
  });

  it("returns 403 not_found when the order isn't in the store", async () => {
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });
    const result = await redeemDownload(dlDeps(), token);
    expect(result).toEqual({ ok: false, status: 403, reason: "not_found" });
    expect(presignCalls).toEqual([]);
  });

  it("returns 403 exhausted when the counter is at zero", async () => {
    await putOrder(store, {
      ...ORDER,
      downloadsRemaining: 0,
      expiresAt: NOW + 1000,
      createdAt: NOW,
    });
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });
    const result = await redeemDownload(dlDeps(), token);
    expect(result).toEqual({ ok: false, status: 403, reason: "exhausted" });
  });

  it("returns 403 expired_order when the order's expiresAt has passed", async () => {
    await putOrder(store, {
      ...ORDER,
      downloadsRemaining: 5,
      expiresAt: NOW - 1,
      createdAt: NOW - 1000,
    });
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });
    const result = await redeemDownload(dlDeps(), token);
    expect(result).toEqual({ ok: false, status: 403, reason: "expired_order" });
  });

  it("on success: returns redirect URL, decrements counter, calls presign with packSlug", async () => {
    await putOrder(store, {
      ...ORDER,
      downloadsRemaining: 5,
      expiresAt: NOW + 1000,
      createdAt: NOW,
    });
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });
    const result = await redeemDownload(dlDeps(), token);
    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://r2.example.com/midnight-velvet.zip?sig=xyz",
      remaining: 4,
    });
    expect(presignCalls).toEqual(["midnight-velvet"]);
  });

  it("parallel redemptions never grant more downloads than the allowance", async () => {
    await putOrder(store, {
      ...ORDER,
      downloadsRemaining: 3,
      expiresAt: NOW + 1000,
      createdAt: NOW,
    });
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });

    const results = await Promise.all(
      Array.from({ length: 10 }, () => redeemDownload(dlDeps(), token)),
    );

    expect(results.filter((r) => r.ok)).toHaveLength(3);
    expect(results.filter((r) => !r.ok)).toEqual(
      Array(7).fill({ ok: false, status: 403, reason: "exhausted" }),
    );
    expect(presignCalls).toHaveLength(3);
    expect((await getOrder(store, ORDER.orderId))?.downloadsRemaining).toBe(0);
  });

  it("answers 503 busy (and presigns nothing) when the order is too contended to update", async () => {
    await putOrder(store, {
      ...ORDER,
      downloadsRemaining: 5,
      expiresAt: NOW + 1000,
      createdAt: NOW,
    });
    const alwaysLoses: KVBackend = { ...store, setIf: async () => false };
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });

    const result = await redeemDownload({ ...dlDeps(), store: alwaysLoses }, token);

    expect(result).toEqual({ ok: false, status: 503, reason: "busy" });
    expect(presignCalls).toEqual([]);
  });
});
