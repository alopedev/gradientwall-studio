// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { processOrderCreated } from "./process-order";
import { getOrder, inMemoryBackend, type KVBackend } from "./orders-store";
import { verifyDownloadToken } from "./signed-token";
import type { LoopsClient } from "./loops";

// Use the real wall-clock so jose's exp validation (which reads the real
// system clock) accepts JWTs we issue here. The relative invariants we test
// (createdAt = NOW, expiresAt = NOW + ttl) hold within the test process.
const NOW = Math.floor(Date.now() / 1000);
const SECRET = "test-jwt-secret-32-chars-padding-ok";

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

describe("processOrderCreated", () => {
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
    await processOrderCreated(baseDeps(), baseInput);
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
    await processOrderCreated(baseDeps(), baseInput);
    const sent = loops.sent[0];
    const url = new URL(sent.dataVariables.downloadUrl);
    const token = url.searchParams.get("token");
    expect(token).toBeTruthy();
    const result = await verifyDownloadToken(token!, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload).toEqual(baseInput);
  });

  it("sends the transactional email with packName + downloadUrl variables", async () => {
    await processOrderCreated(baseDeps(), baseInput);
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

  it("re-issues a fresh token when the same order is processed twice (LS retry)", async () => {
    await processOrderCreated(baseDeps(), baseInput);
    const firstUrl = loops.sent[0].dataVariables.downloadUrl;
    // simulate LS retry 1 second later
    await processOrderCreated({ ...baseDeps(), now: () => NOW + 1 }, baseInput);
    const secondUrl = loops.sent[1].dataVariables.downloadUrl;
    expect(firstUrl).not.toEqual(secondUrl); // tokens differ (issuedAt differs)
    const stored = await getOrder(store, "order_xyz");
    expect(stored?.downloadsRemaining).toBe(5); // counter reset, not stacked
  });

  it("respects ttlSeconds and downloadsAllowed overrides (used by /recover)", async () => {
    await processOrderCreated(
      { ...baseDeps(), ttlSeconds: 60 * 60 * 24 * 7, downloadsAllowed: 3 },
      baseInput,
    );
    const stored = await getOrder(store, "order_xyz");
    expect(stored?.downloadsRemaining).toBe(3);
    expect(stored?.expiresAt).toBe(NOW + 60 * 60 * 24 * 7);
  });
});
