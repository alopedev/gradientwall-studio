import { describe, expect, it } from "vitest";
import packs from "@/data/packs.json";
import { getLanding, IPHONE_SCREENS, LANDINGS, landingPath } from "./landings";
import { buildHomePage, buildLandingPage, buildSeoPages, fullTitle, type SeoPack } from "./pages";
import { outputFile, renderSitemap } from "./render";

describe("landings", () => {
  it("are few, each with its own path, title, headline and description", () => {
    expect(LANDINGS.length).toBeGreaterThan(0);
    expect(LANDINGS.length).toBeLessThan(10);
    for (const key of ["slug", "title", "h1", "description", "subtitle"] as const) {
      expect(new Set(LANDINGS.map((l) => l[key])).size).toBe(LANDINGS.length);
    }
  });

  it("fit search results: title with the brand ≤ 60 characters, description ≤ 160", () => {
    for (const l of LANDINGS) {
      expect(fullTitle(l.title).length, l.slug).toBeLessThanOrEqual(60);
      expect(l.description.length, l.slug).toBeLessThanOrEqual(160);
    }
  });

  it("each say something of their own, not only the shared steps", () => {
    for (const l of LANDINGS) {
      const own = l.guides.filter((g) => g.body.length || g.sizes);
      expect(own.length, l.slug).toBeGreaterThan(0);
    }
  });

  it("live at /<slug>/ and are prerendered, indexable and in the sitemap", () => {
    const pages = buildSeoPages(packs as SeoPack[]);
    const xml = renderSitemap(pages);
    for (const l of LANDINGS) {
      const page = pages.find((p) => p.path === landingPath(l.slug));
      expect(page?.noindex).toBe(false);
      expect(page && outputFile(page)).toBe(`${l.slug}/index.html`);
      expect(xml).toContain(`${landingPath(l.slug)}</loc>`);
    }
  });

  it("give crawlers the headline, a breadcrumb and links to home and the other landings", () => {
    const l = LANDINGS[0];
    const page = buildLandingPage(l);
    expect(page.shell.h1).toBe(l.h1);
    const crumb = page.jsonLd?.find((d) => d["@type"] === "BreadcrumbList");
    expect(JSON.stringify(crumb)).toContain(landingPath(l.slug));
    const hrefs = (page.shell.links ?? []).map((x) => x.href);
    expect(hrefs).toContain("/");
    expect(hrefs).not.toContain(landingPath(l.slug));
    expect(hrefs).toHaveLength(LANDINGS.length);
  });

  it("are linked from the home's crawlable shell", () => {
    const hrefs = (buildHomePage().shell.links ?? []).map((x) => x.href);
    for (const l of LANDINGS) expect(hrefs).toContain(landingPath(l.slug));
  });

  it("list iPhone screens as Apple's specs give them", () => {
    expect(IPHONE_SCREENS).toContainEqual(["iPhone 17 Pro Max · 16 Pro Max", "1320 × 2868"]);
    expect(IPHONE_SCREENS).toContainEqual(["iPhone Air", "1260 × 2736"]);
    expect(IPHONE_SCREENS).toContainEqual(["iPhone 16e", "1170 × 2532"]);
  });

  it("finds a landing by slug", () => {
    expect(getLanding("iphone-gradient-wallpapers")?.look.device).toBe("mobile");
    expect(getLanding("nope")).toBeUndefined();
  });
});
