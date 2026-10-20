// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `public/_headers` is copied to `dist/` and applied by Netlify to every
 * static file. These tests pin the protections it must keep; the exact
 * allow-list of the CSP is checked against the real page in a browser.
 */
function headersFor(path: string): Map<string, string> {
  const text = readFileSync(new URL("../../../public/_headers", import.meta.url), "utf8");
  const out = new Map<string, string>();
  let current: string | null = null;
  for (const raw of text.split("\n")) {
    if (raw.trim() === "" || raw.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      current = raw.trim();
      continue;
    }
    if (current !== path) continue;
    const i = raw.indexOf(":");
    out.set(raw.slice(0, i).trim().toLowerCase(), raw.slice(i + 1).trim());
  }
  return out;
}

function csp(): Map<string, string[]> {
  const value = headersFor("/*").get("content-security-policy") ?? "";
  return new Map(
    value
      .split(";")
      .map((d) => d.trim().split(/\s+/))
      .filter((d) => d[0] !== "")
      .map(([name, ...sources]) => [name, sources]),
  );
}

describe("security headers", () => {
  it("sets the baseline headers on every page", () => {
    const h = headersFor("/*");
    expect(h.get("x-content-type-options")).toBe("nosniff");
    expect(h.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(h.get("x-frame-options")).toBe("DENY");
    expect(h.get("strict-transport-security")).toMatch(/^max-age=\d{8,}/);
    expect(h.get("permissions-policy")).toContain("camera=()");
  });

  it("has a CSP that blocks framing, plugins, foreign scripts and eval", () => {
    const p = csp();
    expect(p.get("default-src")).toEqual(["'self'"]);
    expect(p.get("frame-ancestors")).toEqual(["'none'"]);
    expect(p.get("object-src")).toEqual(["'none'"]);
    expect(p.get("base-uri")).toEqual(["'self'"]);
    expect(p.get("form-action")).toEqual(["'self'"]);
    const scripts = p.get("script-src") ?? [];
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
    // lemon.js is linked on app.lemonsqueezy.com and redirects to assets.
    expect(scripts.filter((s) => s !== "'self'")).toEqual([
      "https://app.lemonsqueezy.com",
      "https://assets.lemonsqueezy.com",
    ]);
  });

  it("lets the Lemon Squeezy checkout overlay open", () => {
    expect(csp().get("frame-src")).toContain("https://*.lemonsqueezy.com");
  });
});
