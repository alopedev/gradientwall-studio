// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LANDING_ROUTES } from "./landing-routes";
import { LANDINGS } from "./landings";

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

  // The landings' copy (descriptions, guides) is only for a landing and the build.
  it("keeps the landings' copy out of the files every page imports", () => {
    for (const file of ["lib/seo/pages.ts", "App.tsx", "components/Footer.tsx", "store/page-start.ts"]) {
      const imports = importsOf(file);
      expect(imports, file).not.toContain("./landings");
      expect(imports, file).not.toContain("@/lib/seo/landings");
      expect(imports, file).not.toContain("./lib/seo/landings");
    }
  });

  it("lists every landing in the light index, with the same route, title, footer and look", () => {
    expect(LANDING_ROUTES).toEqual(
      LANDINGS.map((l) => ({
        slug: l.slug,
        title: l.title,
        footerLabel: l.footerLabel,
        ...(l.footerGroup ? { footerGroup: l.footerGroup } : {}),
        look: l.look,
        ...(l.guide ? { guide: true } : {}),
      })),
    );
  });
});
