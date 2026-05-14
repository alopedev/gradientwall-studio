// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { processOrderCreated } from "./process-order";
import {
  getOrder,
  getOrderByLsOrderId,
  inMemoryBackend,
  type KVBackend,
} from "./orders-store";
import { verifyDownloadToken } from "./signed-token";
import type { LoopsClient } from "./loops";

// Use the real wall-clock so jose's exp validation (which reads the real
// system clock) accepts JWTs we issue here. The relative invariants we test
// (createdAt = NOW, expiresAt = NOW + ttl) hold within the test process.
const NOW = Math.floor(Date.now() / 1000);
const SECRET = "test-jwt-secret-32-chars-padding-ok";
const FAKE_UUID = "00000000-0000-4000-8000-000000000abc";

function fakeLoops(): LoopsClient & { sent: Array<Parameters<LoopsClient["sendTransactional"]>[0]> } {
  const sent: Array<Parameters<LoopsClient["sendTransactional"]>[0]> = [];
  return {
    sent,
    sendTransactional: vi.fn(async (opts) => {
      sent.push(opts);
    }),
    addContact: vi.fn(async () => {}),
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
    lsOrderId: "ls_order_xyz",
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
    uuid: () => FAKE_UUID,
  });

  it("mints our own orderId via the injected uuid factory", async () => {
    const result = await processOrderCreated(baseDeps(), baseInput);
    expect(result.orderId).toBe(FAKE_UUID);
  });

  it("persists the order under our orderId with 5 downloads and the expected expiration", async () => {
    await processOrderCreated(baseDeps(), baseInput);
    const stored = await getOrder(store, FAKE_UUID);
    expect(stored).toMatchObject({
      orderId: FAKE_UUID,
      lsOrderId: "ls_order_xyz",
      packSlug: "midnight-velvet",
      email: "buyer@example.com",
      downloadsRemaining: 5,
      createdAt: NOW,
      expiresAt: NOW + 60 * 60 * 24 * 30,
    });
  });

  it("writes the ls:{lsOrderId} pointer so /recover can resolve from the LS id", async () => {
    await processOrderCreated(baseDeps(), baseInput);
    const viaPointer = await getOrderByLsOrderId(store, "ls_order_xyz");
    expect(viaPointer?.orderId).toBe(FAKE_UUID);
  });

  it("does NOT key the order by the LS id (LS id is buyer-visible, not a capability)", async () => {
    await processOrderCreated(baseDeps(), baseInput);
    expect(await getOrder(store, "ls_order_xyz")).toBeNull();
  });

  it("issues a JWT carrying our orderId (not lsOrderId)", async () => {
    await processOrderCreated(baseDeps(), baseInput);
    const sent = loops.sent[0];
    const url = new URL(sent.dataVariables.downloadUrl);
    const token = url.searchParams.get("token");
    expect(token).toBeTruthy();
    const result = await verifyDownloadToken(token!, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload).toEqual({
        orderId: FAKE_UUID,
        packSlug: "midnight-velvet",
        email: "buyer@example.com",
      });
      // Explicit anti-regression: the LS id must NOT appear in the JWT payload.
      expect(JSON.stringify(result.payload)).not.toContain("ls_order_xyz");
    }
  });

  it("sends the transactional email with packName + downloadUrl variables", async () => {
    await processOrderCreated(baseDeps(), baseInput);
    expect(loops.sent).toHaveLength(1);
    expect(loops.sent[0]).toMatchObject({
      transactionalId: "tpl_123",
      email: "buyer@example.com",
      dataVariables: { packName: "midnight-velvet" },
    });
    expect(loops.sent[0].dataVariables.downloadUrl).toMatch(/^https:\/\/gradientwall\.com\/\.netlify\/functions\/download\?token=/);
  });

  it("re-issues a fresh token + new orderId when the same lsOrderId is processed twice (LS retry)", async () => {
    let uuidCalls = 0;
    const uuids = ["uuid-first", "uuid-second"];
    const deps = () => ({ ...baseDeps(), uuid: () => uuids[uuidCalls++] });

    await processOrderCreated(deps(), baseInput);
    const firstUrl = loops.sent[0].dataVariables.downloadUrl;
    // simulate LS retry 1 second later
    await processOrderCreated({ ...deps(), now: () => NOW + 1 }, baseInput);
    const secondUrl = loops.sent[1].dataVariables.downloadUrl;
    expect(firstUrl).not.toEqual(secondUrl);
    // Pointer now resolves to the second order; counter is fresh.
    const stored = await getOrderByLsOrderId(store, "ls_order_xyz");
    expect(stored?.orderId).toBe("uuid-second");
    expect(stored?.downloadsRemaining).toBe(5);
  });

  it("respects ttlSeconds and downloadsAllowed overrides", async () => {
    await processOrderCreated(
      { ...baseDeps(), ttlSeconds: 60 * 60 * 24 * 7, downloadsAllowed: 3 },
      baseInput,
    );
    const stored = await getOrder(store, FAKE_UUID);
    expect(stored?.downloadsRemaining).toBe(3);
    expect(stored?.expiresAt).toBe(NOW + 60 * 60 * 24 * 7);
  });
});
