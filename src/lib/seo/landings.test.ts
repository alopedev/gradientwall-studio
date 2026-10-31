import { describe, expect, it } from "vitest";
import packs from "@/data/packs.json";
import {
  GUIDES,
  getLanding,
  IPHONE_SCREENS,
  LANDINGS,
  landingPath,
  MACBOOK_SCREENS,
} from "./landings";
import { buildHomePage, fullTitle, type SeoPack } from "./pages";
import { buildLandingPage, buildSeoPages } from "./site-pages";
import { outputFile, renderSitemap } from "./render";

describe("landings", () => {
  it("are few, each with its own path, title, headline and description", () => {
    expect(LANDINGS.length).toBeGreaterThan(0);
    expect(LANDINGS.length).toBeLessThan(30);
    for (const key of ["slug", "title", "h1", "description", "subtitle"] as const) {
      expect(new Set(LANDINGS.map((l) => l[key])).size).toBe(LANDINGS.length);
    }
  });

  it("each wallpaper page has a footer group; the guides have none", () => {
    for (const l of LANDINGS) {
      expect(Boolean(l.footerGroup), l.slug).toBe(!l.guide);
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

  it("list their gallery for Google Images: sitemap, share image and licensable ImageObjects", () => {
    for (const l of LANDINGS.filter((x) => !x.guide)) {
      const page = buildLandingPage(l);
      expect(page.images?.length).toBeGreaterThanOrEqual(12);
      expect(page.ogImage).toBe(`/assets/gallery/${l.slug}/og.jpg`);
      expect(page.ogImageSize).toEqual({ width: 1200, height: 630 });
      const objects = (page.jsonLd ?? []).filter((d) => d["@type"] === "ImageObject");
      expect(objects).toHaveLength(page.images?.length ?? 0);
      expect(objects[0]).toMatchObject({
        license: "https://gradientwall.app/licence/",
        acquireLicensePage: "https://gradientwall.app/licence/",
        creditText: "GradientWall",
      });
      expect(String(objects[0].contentUrl)).toMatch(
        /^https:\/\/gradientwall\.app\/assets\/gallery\//,
      );
    }
  });

  it("are linked from the home's crawlable shell", () => {
    const hrefs = (buildHomePage().shell.links ?? []).map((x) => x.href);
    for (const l of LANDINGS) expect(hrefs).toContain(landingPath(l.slug));
  });

  it("list iPhone screens as Apple's specs give them", () => {
    expect(IPHONE_SCREENS).toContainEqual([
      "iPhone 18 Pro Max · 17 Pro Max · 16 Pro Max",
      "1320 × 2868",
    ]);
    expect(IPHONE_SCREENS).toContainEqual(["iPhone Air", "1260 × 2736"]);
    expect(IPHONE_SCREENS).toContainEqual(["iPhone 17e · 16e", "1170 × 2532"]);
  });

  it("put the how-to guides under /guides/", () => {
    expect(GUIDES.map((g) => landingPath(g.slug))).toEqual([
      "/guides/iphone-wallpaper-size/",
      "/guides/iphone-gradient-wallpaper-not-working/",
      "/guides/macbook-wallpaper-size/",
    ]);
  });

  it("list MacBook screens as Apple's specs give them", () => {
    expect(MACBOOK_SCREENS).toContainEqual(['MacBook Air 13"', "2560 × 1664"]);
    expect(MACBOOK_SCREENS).toContainEqual(['MacBook Pro 16"', "3456 × 2234"]);
    expect(MACBOOK_SCREENS).toContainEqual(["MacBook Neo", "2408 × 1506"]);
    expect(MACBOOK_SCREENS).toContainEqual([
      'MacBook Air 13" (M1) · MacBook Pro 13"',
      "2560 × 1600",
    ]);
  });

  it("finds a landing by slug", () => {
    expect(getLanding("iphone-gradient-wallpapers")?.look.device).toBe("mobile");
    expect(getLanding("nope")).toBeUndefined();
  });
});
