// @vitest-environment node
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCatalog } from "./catalog";
import { MissingEnvError, type WebhookEnv } from "./env";
import { brokenStore, captureLogs, failingLoops, fakeLoops } from "./handler-test-utils";
import { createWebhookHandler, type WebhookHandlerDeps } from "./webhook-handler";
import { getOrder, inMemoryBackend, type KVBackend } from "./orders-store";

const NOW = Math.floor(Date.now() / 1000);
const ENV: WebhookEnv = {
  jwtSecret: "test-jwt-secret-32-chars-padding-ok",
  lsWebhookSecret: "whsec_test",
  loopsApiKey: "loops-key",
  loopsTransactionalId: "tpl_123",
  publicSiteUrl: "https://gradientwall.test",
};

const CATALOG = buildCatalog([
  { slug: "dessau", name: "Dessau", lemonSqueezyVariantId: 777 },
  { slug: "acrylic", name: "Impasto", lemonSqueezyVariantId: 888 },
]);

function paidOrder(
  overrides: {
    status?: string;
    eventName?: string;
    variant?: number | null;
    slug?: string | null;
  } = {},
) {
  const variant = overrides.variant === undefined ? 777 : overrides.variant;
  const slug = overrides.slug === undefined ? "dessau" : overrides.slug;
  return JSON.stringify({
    meta: {
      event_name: overrides.eventName ?? "order_created",
      custom_data: slug === null ? {} : { pack_slug: slug },
    },
    data: {
      id: "1001",
      type: "orders",
      attributes: {
        user_email: "buyer@example.com",
        status: overrides.status ?? "paid",
        ...(variant === null ? {} : { first_order_item: { variant_id: variant } }),
      },
    },
  });
}

function sign(body: string, secret = ENV.lsWebhookSecret): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function post(body: string, signature: string | null = sign(body), method = "POST"): Request {
  const headers: Record<string, string> = {};
  if (signature !== null) headers["x-signature"] = signature;
  return new Request("https://gradientwall.test/.netlify/functions/lemon-squeezy-webhook", {
    method,
    headers,
    ...(method === "POST" ? { body } : {}),
  });
}

describe("webhook handler", () => {
  let store: KVBackend;
  let loops: ReturnType<typeof fakeLoops>;
  let logs: ReturnType<typeof captureLogs>;

  const handler = (overrides: Partial<WebhookHandlerDeps> = {}) =>
    createWebhookHandler({
      readEnv: () => ENV,
      store: () => store,
      loops: () => loops,
      catalog: () => CATALOG,
      now: () => NOW,
      ...overrides,
    });

  beforeEach(() => {
    logs = captureLogs();
    store = inMemoryBackend();
    loops = fakeLoops();
  });

  afterEach(() => vi.restoreAllMocks());

  it("only answers POST", async () => {
    const res = await handler()(post("", null, "GET"));
    expect(res.status).toBe(405);
  });

  it("rejects a missing signature", async () => {
    const res = await handler()(post(paidOrder(), null));
    expect(res.status).toBe(401);
    expect(await getOrder(store, "1001")).toBeNull();
  });

  it("rejects a signature made with another secret", async () => {
    const body = paidOrder();
    const res = await handler()(post(body, sign(body, "someone-elses-secret")));
    expect(res.status).toBe(401);
    expect(loops.sent).toHaveLength(0);
  });

  it("rejects a body that was altered after signing", async () => {
    const signature = sign(paidOrder({ variant: 777 }));
    const res = await handler()(post(paidOrder({ variant: 888 }), signature));
    expect(res.status).toBe(401);
    expect(await getOrder(store, "1001")).toBeNull();
  });

  it("answers 400 to a signed body that is not JSON", async () => {
    const res = await handler()(post("{not json"));
    expect(res.status).toBe(400);
  });

  it("acknowledges events it does not act on, so Lemon Squeezy does not retry", async () => {
    for (const body of [
      paidOrder({ eventName: "subscription_created" }),
      paidOrder({ status: "pending" }),
      JSON.stringify({ unrelated: true }),
    ]) {
      const res = await handler()(post(body));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, ignored: true });
    }
    expect(await getOrder(store, "1001")).toBeNull();
    expect(loops.sent).toHaveLength(0);
  });

  it("stores the order and mails the download link for a paid order", async () => {
    const res = await handler()(post(paidOrder()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(await getOrder(store, "1001")).toMatchObject({
      orderId: "1001",
      packSlug: "dessau",
      email: "buyer@example.com",
      downloadsRemaining: 5,
      createdAt: NOW,
    });
    expect(loops.sent).toHaveLength(1);
    expect(loops.sent[0]).toMatchObject({
      transactionalId: ENV.loopsTransactionalId,
      email: "buyer@example.com",
    });
    expect(loops.sent[0].dataVariables.downloadUrl).toMatch(
      /^https:\/\/gradientwall\.test\/\.netlify\/functions\/download\?token=/,
    );
  });

  it("delivers the pack of the paid variant, not the one claimed in the checkout URL", async () => {
    const res = await handler()(post(paidOrder({ variant: 888, slug: "dessau" })));
    expect(res.status).toBe(200);
    expect((await getOrder(store, "1001"))?.packSlug).toBe("acrylic");
    expect(loops.sent[0].dataVariables.packName).toBe("Impasto");
    expect(logs.warn).toHaveBeenCalledWith(expect.stringContaining("ignored"));
  });

  it("delivers a paid order that carries no pack_slug at all", async () => {
    const res = await handler()(post(paidOrder({ slug: null })));
    expect(res.status).toBe(200);
    expect((await getOrder(store, "1001"))?.packSlug).toBe("dessau");
  });

  it("answers 422 and delivers nothing when the paid variant is unknown or missing", async () => {
    for (const [variant, reason] of [
      [999, "unknown_variant"],
      [null, "missing_variant"],
    ] as const) {
      const res = await handler()(post(paidOrder({ variant })));
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({ ok: false, reason });
    }
    expect(await getOrder(store, "1001")).toBeNull();
    expect(loops.sent).toHaveLength(0);
    expect(logs.error).toHaveBeenCalled();
  });

  it("builds the Loops client with the key from the env", async () => {
    const loopsFactory = vi.fn(() => loops);
    await handler({ loops: loopsFactory })(post(paidOrder()));
    expect(loopsFactory).toHaveBeenCalledWith(ENV.loopsApiKey);
  });

  it("answers 500 when the email cannot be sent, so Lemon Squeezy retries", async () => {
    const res = await handler({ loops: () => failingLoops() })(post(paidOrder()));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, reason: "internal_error" });
  });

  it("answers 500 when the store is down", async () => {
    const res = await handler({ store: () => brokenStore() })(post(paidOrder()));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, reason: "internal_error" });
  });

  it("answers 500 misconfigured when a variable is missing", async () => {
    const readEnv = () => {
      throw new MissingEnvError("LS_WEBHOOK_SECRET");
    };
    const res = await handler({ readEnv })(post(paidOrder()));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, reason: "misconfigured" });
    expect(logs.error).toHaveBeenCalledWith(expect.stringContaining("LS_WEBHOOK_SECRET"));
  });
});
