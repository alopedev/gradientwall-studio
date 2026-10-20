// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCatalog } from "./catalog";
import { MissingEnvError, readRecoverEnv, type RecoverEnv } from "./env";
import { brokenStore, captureLogs, failingLoops, fakeLoops } from "./handler-test-utils";
import { createRecoverHandler, type RecoverHandlerDeps } from "./recover-handler";
import { getOrder, inMemoryBackend, kvOrderStore, putOrder, type KVBackend } from "./orders-store";

const NOW = Math.floor(Date.now() / 1000);
const ENV: RecoverEnv = {
  jwtSecret: "test-jwt-secret-32-chars-padding-ok",
  lsApiKey: "ls-key",
  loopsApiKey: "loops-key",
  loopsTransactionalId: "tpl_123",
  publicSiteUrl: "https://gradientwall.test",
};
const CATALOG = buildCatalog([{ slug: "dessau", name: "Dessau", lemonSqueezyVariantId: 777 }]);
const GENERIC = {
  ok: true,
  message: "If the order exists, a recovery email has been sent.",
};

function post(body: unknown, method = "POST"): Request {
  return new Request("https://gradientwall.test/.netlify/functions/recover-link", {
    method,
    ...(method === "POST"
      ? {
          headers: { "content-type": "application/json" },
          body: typeof body === "string" ? body : JSON.stringify(body),
        }
      : {}),
  });
}

describe("recover handler", () => {
  let store: KVBackend;
  let loops: ReturnType<typeof fakeLoops>;
  let lookupOrderEmail: ReturnType<typeof vi.fn<RecoverHandlerDeps["lookupOrderEmail"]>>;
  let logs: ReturnType<typeof captureLogs>;

  const handler = (overrides: Partial<RecoverHandlerDeps> = {}) =>
    createRecoverHandler({
      readEnv: () => ENV,
      store: () => kvOrderStore(store),
      loops: () => loops,
      lookupOrderEmail,
      catalog: () => CATALOG,
      now: () => NOW,
      ...overrides,
    });

  beforeEach(async () => {
    logs = captureLogs();
    store = inMemoryBackend();
    loops = fakeLoops();
    lookupOrderEmail = vi.fn(async (orderId: string) => ({
      orderId,
      email: "buyer@example.com",
    }));
    await putOrder(store, {
      orderId: "1001",
      packSlug: "dessau",
      email: "buyer@example.com",
      downloadsRemaining: 3,
      expiresAt: NOW + 3600,
      createdAt: NOW - 100,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  const real = { orderId: "1001", email: "buyer@example.com" };

  it("only answers POST", async () => {
    const res = await handler()(post(null, "GET"));
    expect(res.status).toBe(405);
  });

  it("answers 415 to a body not sent as JSON, without touching the order", async () => {
    const res = await handler()(
      new Request("https://gradientwall.test/api/recover-link", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify(real),
      }),
    );
    expect(res.status).toBe(415);
    expect(lookupOrderEmail).not.toHaveBeenCalled();
    expect(loops.sent).toHaveLength(0);
  });

  it("answers 400 to bodies that are not a JSON object", async () => {
    for (const body of ["{nope", "null", "[]", '"text"', "42", ""]) {
      const res = await handler()(post(body));
      expect(res.status, `body: ${body}`).toBe(400);
    }
    expect(loops.sent).toHaveLength(0);
  });

  it("mails a fresh link for a real order and answers the generic 200", async () => {
    const res = await handler()(post(real));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(GENERIC);

    expect(lookupOrderEmail).toHaveBeenCalledWith("1001", ENV.lsApiKey);
    expect(loops.sent).toHaveLength(1);
    expect(loops.sent[0]).toMatchObject({ email: "buyer@example.com" });
    expect(loops.sent[0].dataVariables.packName).toBe("Dessau");
    expect(loops.sent[0].dataVariables.downloadUrl).toContain(
      "/.netlify/functions/download?token=",
    );
    // Recovery keeps what the buyer has left.
    expect((await getOrder(store, "1001"))?.downloadsRemaining).toBe(3);
  });

  it("answers the same body whether or not the order exists, matches, or is spent", async () => {
    await putOrder(store, {
      orderId: "spent",
      packSlug: "dessau",
      email: "buyer@example.com",
      downloadsRemaining: 0,
      expiresAt: NOW + 3600,
      createdAt: NOW,
    });
    const cases = [
      { orderId: "nope", email: "buyer@example.com" },
      { orderId: "1001", email: "someone@else.com" },
      { orderId: "spent", email: "buyer@example.com" },
      { orderId: "", email: "" },
      { orderId: 5, email: null },
      {},
    ];
    for (const body of cases) {
      const res = await handler()(post(body));
      expect(res.status, JSON.stringify(body)).toBe(200);
      expect(await res.json()).toEqual(GENERIC);
    }
    expect(loops.sent).toHaveLength(0);
  });

  it("does not reveal a real order when Loops is down", async () => {
    const real500 = await handler({ loops: () => failingLoops() })(post(real));
    const fake = await handler({ loops: () => failingLoops() })(
      post({ orderId: "nope", email: "buyer@example.com" }),
    );
    expect(real500.status).toBe(200);
    expect(await real500.json()).toEqual(GENERIC);
    expect(fake.status).toBe(200);
    expect(logs.error).toHaveBeenCalled();
  });

  it("does not reveal a real order when the store is down", async () => {
    const res = await handler({ store: () => brokenStore() })(post(real));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(GENERIC);
    expect(logs.error).toHaveBeenCalled();
  });

  it("does not need any R2 variable", async () => {
    // Only the variables /recover-link uses: no R2_* at all.
    const noR2 = {
      JWT_SECRET: ENV.jwtSecret,
      LS_API_KEY: ENV.lsApiKey,
      LOOPS_API_KEY: ENV.loopsApiKey,
      LOOPS_TRANSACTIONAL_ID: ENV.loopsTransactionalId,
      PUBLIC_SITE_URL: ENV.publicSiteUrl,
    };

    const res = await handler({ readEnv: () => readRecoverEnv(noR2) })(post(real));
    expect(res.status).toBe(200);
    expect(loops.sent).toHaveLength(1);
  });

  it("answers 500 misconfigured when a variable it needs is missing", async () => {
    const readEnv = () => {
      throw new MissingEnvError("LS_API_KEY");
    };
    const res = await handler({ readEnv })(post(real));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, reason: "misconfigured" });
    expect(loops.sent).toHaveLength(0);
  });

  it("answers 500 misconfigured when the order store is half configured", async () => {
    const store = () => {
      throw new MissingEnvError("SUPABASE_SECRET_KEY");
    };
    const res = await handler({ store })(post(real));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, reason: "misconfigured" });
  });
});
