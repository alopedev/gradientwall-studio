// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Static imports of a source file under src/. */
function importsOf(file: string): string[] {
  const src = readFileSync(`${process.cwd()}/src/${file}`, "utf8");
  return [...src.matchAll(/^import\s+(?!type\b)[^;]*?from\s+"([^"]+)"/gms)].map((m) => m[1]);
}

describe("what every page downloads", () => {
  // pages.ts is imported by the nav, the hero and the footer, so whatever it
  // imports ships on every page. The landing galleries are only for landings.
  it("keeps the landing galleries out of the per-page SEO module", () => {
    expect(importsOf("lib/seo/pages.ts")).not.toContain("./gallery");
  });
});
