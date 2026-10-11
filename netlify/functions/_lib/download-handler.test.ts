// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDownloadHandler, type DownloadHandlerDeps } from "./download-handler";
import { MissingEnvError, type DownloadEnv } from "./env";
import { getOrder, inMemoryBackend, kvOrderStore, putOrder, type KVBackend } from "./orders-store";
import { issueDownloadToken } from "./signed-token";
import { brokenStore, captureLogs } from "./handler-test-utils";

// jose validates `exp` against the real clock, so tokens use real time.
const NOW = Math.floor(Date.now() / 1000);
const SECRET = "test-jwt-secret-32-chars-padding-ok";
const ENV: DownloadEnv = {
  jwtSecret: SECRET,
  r2AccountId: "acc",
  r2AccessKeyId: "akid",
  r2SecretAccessKey: "r2-secret-value",
  r2BucketPacks: "gw-packs",
};

async function tokenFor(orderId = "ord_1", packSlug = "dessau") {
  return issueDownloadToken({
    payload: { orderId, packSlug, email: "buyer@example.com" },
    ttlSeconds: 3600,
    secret: SECRET,
    iat: NOW,
  });
}

function request(token: string | null, method = "GET"): Request {
  const url = new URL("https://gradientwall.test/.netlify/functions/download");
  if (token !== null) url.searchParams.set("token", token);
  return new Request(url, { method });
}

describe("download handler", () => {
  let store: KVBackend;
  let presign: ReturnType<typeof vi.fn<DownloadHandlerDeps["presign"]>>;
  let logs: ReturnType<typeof captureLogs>;

  const handler = (overrides: Partial<DownloadHandlerDeps> = {}) =>
    createDownloadHandler({
      readEnv: () => ENV,
      store: () => kvOrderStore(store),
      presign,
      now: () => NOW,
      ...overrides,
    });

  beforeEach(async () => {
    logs = captureLogs();
    store = inMemoryBackend();
    presign = vi.fn(async (_env, slug) => `https://r2.example/packs/${slug}.zip?sig=abc`);
    await putOrder(store, {
      orderId: "ord_1",
      packSlug: "dessau",
      email: "buyer@example.com",
      downloadsRemaining: 2,
      expiresAt: NOW + 3600,
      createdAt: NOW,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("only answers GET", async () => {
    const res = await handler()(request(await tokenFor(), "POST"));
    expect(res.status).toBe(405);
  });

  it("rejects a request without a token", async () => {
    const res = await handler()(request(null));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, reason: "invalid_token" });
  });

  it("rejects a token signed with another secret", async () => {
    const forged = await issueDownloadToken({
      payload: { orderId: "ord_1", packSlug: "dessau", email: "buyer@example.com" },
      ttlSeconds: 3600,
      secret: "another-secret-another-secret-123456",
      iat: NOW,
    });
    const res = await handler()(request(forged));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, reason: "invalid_token" });
  });

  it("redirects to the presigned URL of the token's pack and spends a download", async () => {
    const res = await handler()(request(await tokenFor()));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://r2.example/packs/dessau.zip?sig=abc");
    expect(presign).toHaveBeenCalledWith(ENV, "dessau");
    expect((await getOrder(store, "ord_1"))?.downloadsRemaining).toBe(1);
  });

  it("answers 403 once the allowance is spent, without presigning", async () => {
    const h = handler();
    const token = await tokenFor();
    expect((await h(request(token))).status).toBe(302);
    expect((await h(request(token))).status).toBe(302);
    const res = await h(request(token));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ ok: false, reason: "exhausted" });
    expect(presign).toHaveBeenCalledTimes(2);
  });

  it("answers 403 not_found for a valid token whose order is unknown", async () => {
    const res = await handler()(request(await tokenFor("ord_ghost")));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ ok: false, reason: "not_found" });
  });

  it("answers 503 with Retry-After when the order record stays contended", async () => {
    const contended: KVBackend = { ...store, setIf: async () => false };
    const res = await handler({ store: () => kvOrderStore(contended) })(request(await tokenFor()));
    expect(res.status).toBe(503);
    expect(res.headers.get("retry-after")).toBe("1");
    expect(await res.json()).toEqual({ ok: false, reason: "busy" });
  });

  it("answers 500 misconfigured when a variable is missing, without leaking config", async () => {
    const readEnv = () => {
      throw new MissingEnvError("R2_BUCKET_PACKS");
    };
    const res = await handler({ readEnv })(request(await tokenFor()));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, reason: "misconfigured" });
    expect(logs.error).toHaveBeenCalledWith(expect.stringContaining("R2_BUCKET_PACKS"));
  });

  it("answers 500 internal_error when the store is down", async () => {
    const res = await handler({ store: () => brokenStore() })(request(await tokenFor()));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, reason: "internal_error" });
  });

  it("answers 500 internal_error when presigning fails, hiding the cause", async () => {
    presign.mockRejectedValue(new Error(`bad credentials ${ENV.r2SecretAccessKey}`));
    const res = await handler()(request(await tokenFor()));
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ ok: false, reason: "internal_error" });
    expect(text).not.toContain(ENV.r2SecretAccessKey);
  });
});
