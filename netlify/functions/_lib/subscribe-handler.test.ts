// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MissingEnvError } from "./env";
import { captureLogs } from "./handler-test-utils";
import type { LoopsFormClient, LoopsFormResult } from "./loops-form";
import { createSubscribeHandler } from "./subscribe-handler";

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
  let subscribe: ReturnType<typeof vi.fn<LoopsFormClient["subscribe"]>>;
  let logs: ReturnType<typeof captureLogs>;

  const handler = (readEnv = () => ({ loopsFormId: "form_1" })) =>
    createSubscribeHandler({ readEnv, form: () => ({ subscribe }) });

  beforeEach(() => {
    logs = captureLogs();
    subscribe = vi.fn(async (): Promise<LoopsFormResult> => "ok");
  });

  it("subscribes a valid email with its source and answers 200", async () => {
    const res = await handler()(post({ email: " Ana@Example.com ", source: "footer" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(subscribe).toHaveBeenCalledWith({ email: "Ana@Example.com", source: "footer" });
  });

  it("falls back to source 'web' for anything unknown", async () => {
    await handler()(post({ email: "a@b.co", source: "<script>" }));
    expect(subscribe).toHaveBeenCalledWith({ email: "a@b.co", source: "web" });
  });

  it("rejects non-POST, bad JSON and non-object bodies", async () => {
    expect((await handler()(post({}, "GET"))).status).toBe(405);
    expect((await handler()(post("{nope"))).status).toBe(400);
    expect((await handler()(post(["a@b.co"]))).status).toBe(400);
    expect((await handler()(post({ email: 5 }))).status).toBe(400);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it.each([
    "",
    "plain",
    "a@b",
    "a b@c.co",
    "@c.co",
    `${"a".repeat(250)}@b.co`,
  ])("rejects the invalid email %j without calling Loops", async (email) => {
    const res = await handler()(post({ email }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, reason: "invalid_email" });
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("answers 200 and does nothing when the honeypot is filled", async () => {
    const res = await handler()(post({ email: "a@b.co", website: "http://spam" }));
    expect(res.status).toBe(200);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("passes Loops' rate limit and invalid-email answers on", async () => {
    subscribe.mockResolvedValueOnce("rate_limited");
    expect((await handler()(post({ email: "a@b.co" }))).status).toBe(429);
    subscribe.mockResolvedValueOnce("invalid_email");
    expect((await handler()(post({ email: "a@b.co" }))).status).toBe(400);
  });

  it("answers 500 misconfigured when LOOPS_FORM_ID is missing", async () => {
    const res = await handler(() => {
      throw new MissingEnvError("LOOPS_FORM_ID");
    })(post({ email: "a@b.co" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, reason: "misconfigured" });
  });

  it("answers 500 internal_error when Loops fails, and never logs the address", async () => {
    subscribe.mockRejectedValueOnce(new Error("Loops form failed: 500"));
    const res = await handler()(post({ email: "secret@example.com" }));
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
