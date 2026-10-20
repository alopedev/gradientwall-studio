// @vitest-environment node
import { describe, expect, it } from "vitest";
import { config as recoverConfig } from "./recover-link";
import { config as subscribeConfig } from "./subscribe";

/**
 * The two endpoints anyone can call without a token. Each request to
 * /recover-link costs a Lemon Squeezy lookup and maybe an email; each one to
 * /subscribe writes a row. Netlify enforces these limits before the code runs
 * (code rules need a custom `path`; the free plan allows two of them).
 */
describe("public function config", () => {
  it.each([
    ["subscribe", subscribeConfig, "/api/subscribe"],
    ["recover-link", recoverConfig, "/api/recover-link"],
  ])("%s has its own path and a per-IP rate limit", (_name, config, path) => {
    expect(config.path).toBe(path);
    expect(config.rateLimit?.aggregateBy).toEqual(["ip", "domain"]);
    expect(config.rateLimit?.windowSize).toBe(60);
    expect(config.rateLimit?.windowLimit).toBeLessThanOrEqual(10);
  });
});
