import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isNewsletterEnabled, subscribeEmail } from "./subscribe";

describe("subscribeEmail", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("posts the trimmed email with its source to the Function", async () => {
    fetchSpy.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    const out = await subscribeEmail({ email: "  a@b.co ", source: "footer" });
    expect(out).toEqual({ kind: "ok" });
    expect(fetchSpy).toHaveBeenCalledWith(
      "/.netlify/functions/subscribe",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.co", source: "footer", website: "" }),
      }),
    );
  });

  it.each([
    [400, '{"ok":false,"reason":"invalid_email"}', "invalid_email"],
    [400, "{}", "failed"],
    [429, "{}", "rate_limited"],
    [500, '{"ok":false,"reason":"misconfigured"}', "failed"],
  ])("maps status %i %s to %s", async (status, body, reason) => {
    fetchSpy.mockResolvedValue(new Response(body, { status }));
    expect(await subscribeEmail({ email: "a@b.co", source: "studio" })).toEqual({
      kind: "error",
      reason,
    });
  });

  it("reports a network failure as 'failed'", async () => {
    fetchSpy.mockRejectedValue(new TypeError("offline"));
    expect(await subscribeEmail({ email: "a@b.co", source: "studio" })).toEqual({
      kind: "error",
      reason: "failed",
    });
  });
});

describe("isNewsletterEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is on only for the exact string 'true'", () => {
    vi.stubEnv("VITE_NEWSLETTER_ENABLED", "true");
    expect(isNewsletterEnabled()).toBe(true);
    vi.stubEnv("VITE_NEWSLETTER_ENABLED", "1");
    expect(isNewsletterEnabled()).toBe(false);
    vi.stubEnv("VITE_NEWSLETTER_ENABLED", "");
    expect(isNewsletterEnabled()).toBe(false);
  });
});
