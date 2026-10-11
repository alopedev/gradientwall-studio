// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MissingEnvError } from "./env";
import { captureLogs } from "./handler-test-utils";
import { createSubscribeHandler } from "./subscribe-handler";
import type { SubscriberStore } from "./supabase-subscribers";

const CONSENT = "Now and then: new packs and Studio features. You can unsubscribe at any time.";

function post(body: unknown, method = "POST"): Request {
  return new Request("https://gradientwall.test/.netlify/functions/subscribe", {
    method,
    ...(method === "POST"
      ? {
          headers: { "content-type": "application/json" },
          body: typeof body === "string" ? body : JSON.stringify(body),
        }
      : {}),
  });
}

describe("subscribe handler", () => {
  let subscribe: ReturnType<typeof vi.fn<SubscriberStore["subscribe"]>>;
  let logs: ReturnType<typeof captureLogs>;

  const handler = (
    readEnv = () => ({ url: "https://abcd.supabase.co", secretKey: "sb_secret_x" }),
  ) => createSubscribeHandler({ readEnv, store: () => ({ subscribe }) });

  beforeEach(() => {
    logs = captureLogs();
    subscribe = vi.fn(async () => {});
  });

  it("stores a valid email with its source and consent wording and answers 200", async () => {
    const res = await handler()(
      post({ email: " Ana@Example.com ", source: "footer", consentText: CONSENT }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(subscribe).toHaveBeenCalledWith({
      email: "Ana@Example.com",
      source: "footer",
      consentText: CONSENT,
    });
  });

  it("falls back to source 'web' for anything unknown", async () => {
    await handler()(post({ email: "a@b.co", source: "<script>", consentText: CONSENT }));
    expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({ source: "web" }));
  });

  it("rejects non-POST, bad JSON, non-object bodies and a missing or huge consent text", async () => {
    expect((await handler()(post({}, "GET"))).status).toBe(405);
    expect((await handler()(post("{nope"))).status).toBe(400);
    expect((await handler()(post(["a@b.co"]))).status).toBe(400);
    expect((await handler()(post({ email: 5, consentText: CONSENT }))).status).toBe(400);
    expect((await handler()(post({ email: "a@b.co" }))).status).toBe(400);
    expect((await handler()(post({ email: "a@b.co", consentText: "x".repeat(501) }))).status).toBe(
      400,
    );
    expect(subscribe).not.toHaveBeenCalled();
  });

  it.each([
    "",
    "plain",
    "a@b",
    "a b@c.co",
    "@c.co",
    `${"a".repeat(250)}@b.co`,
  ])("rejects the invalid email %j without storing it", async (email) => {
    const res = await handler()(post({ email, consentText: CONSENT }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, reason: "invalid_email" });
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("answers 200 and stores nothing when the honeypot is filled", async () => {
    const res = await handler()(
      post({ email: "a@b.co", website: "http://spam", consentText: CONSENT }),
    );
    expect(res.status).toBe(200);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("answers 500 misconfigured when the Supabase variables are missing", async () => {
    const res = await handler(() => {
      throw new MissingEnvError("SUPABASE_URL");
    })(post({ email: "a@b.co", consentText: CONSENT }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, reason: "misconfigured" });
  });

  it("answers 500 internal_error when Supabase fails, and never logs the address", async () => {
    subscribe.mockRejectedValueOnce(new Error("Supabase rpc subscribe_email failed: 503"));
    const res = await handler()(post({ email: "secret@example.com", consentText: CONSENT }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, reason: "internal_error" });
    const logged = JSON.stringify([
      ...logs.error.mock.calls,
      ...logs.log.mock.calls,
      ...logs.warn.mock.calls,
    ]);
    expect(logged).not.toContain("secret@example.com");
  });
});
