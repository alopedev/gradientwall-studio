// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { processDownload } from "./process-download";
import { inMemoryBackend, putOrder, type KVBackend } from "./orders-store";
import { issueDownloadToken } from "./signed-token";

const NOW = 1_700_000_000;
const SECRET = "download-secret-32-chars-padding-ok";
const ORDER = {
  orderId: "order_123",
  packSlug: "midnight-velvet",
  email: "buyer@example.com",
};

describe("processDownload", () => {
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

  const deps = () => ({ store, jwtSecret: SECRET, presign, now: () => NOW });

  it("rejects a missing token with 401 invalid_token", async () => {
    expect(await processDownload(deps(), null)).toEqual({
      ok: false,
      status: 401,
      reason: "invalid_token",
    });
  });

  it("rejects a token signed with a different secret as 401 invalid_token", async () => {
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: "different-secret-padding" });
    const result = await processDownload(deps(), token);
    expect(result).toEqual({ ok: false, status: 401, reason: "invalid_token" });
  });

  it("rejects an expired token as 401 expired_token", async () => {
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: -1, secret: SECRET });
    const result = await processDownload(deps(), token);
    expect(result).toEqual({ ok: false, status: 401, reason: "expired_token" });
  });

  it("returns 403 not_found when the order isn't in the store", async () => {
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });
    const result = await processDownload(deps(), token);
    expect(result).toEqual({ ok: false, status: 403, reason: "not_found" });
    expect(presignCalls).toEqual([]);
  });

  it("returns 403 exhausted when the counter is at zero", async () => {
    await putOrder(store, {
      ...ORDER,
      lsOrderId: "ls_123",
      downloadsRemaining: 0,
      expiresAt: NOW + 1000,
      createdAt: NOW,
    });
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });
    const result = await processDownload(deps(), token);
    expect(result).toEqual({ ok: false, status: 403, reason: "exhausted" });
  });

  it("returns 403 expired_order when the order's expiresAt has passed", async () => {
    await putOrder(store, {
      ...ORDER,
      lsOrderId: "ls_123",
      downloadsRemaining: 5,
      expiresAt: NOW - 1,
      createdAt: NOW - 1000,
    });
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });
    const result = await processDownload(deps(), token);
    expect(result).toEqual({ ok: false, status: 403, reason: "expired_order" });
  });

  it("on success: returns redirect URL, decrements counter, calls presign with packSlug", async () => {
    await putOrder(store, {
      ...ORDER,
      lsOrderId: "ls_123",
      downloadsRemaining: 5,
      expiresAt: NOW + 1000,
      createdAt: NOW,
    });
    const token = await issueDownloadToken({ payload: ORDER, ttlSeconds: 60, secret: SECRET });
    const result = await processDownload(deps(), token);
    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://r2.example.com/midnight-velvet.zip?sig=xyz",
      remaining: 4,
    });
    expect(presignCalls).toEqual(["midnight-velvet"]);
  });
});
