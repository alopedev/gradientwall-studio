import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packsData from "../../data/packs.json";
import {
  absoluteUrl,
  buildHomePage,
  buildPackPage,
  buildSeoPages,
  fullTitle,
  HOME_DESCRIPTION,
  HOME_TITLE,
  HOME_JSON_LD,
  NOT_FOUND_PAGE,
  PRIVACY_PAGE,
  packPath,
  RECOVER_PAGE,
  type SeoPack,
} from "./pages";
import {
  HEAD_END,
  HEAD_START,
  outputFile,
  renderHeadTags,
  renderPage,
  renderSitemap,
  replaceHeadBlock,
} from "./render";

const packs = packsData as SeoPack[];
const TEMPLATE = `<html><head>\n    ${HEAD_START}\n    ${HEAD_END}\n    <meta name="theme-color" /></head><body><div id="root"></div></body></html>`;

describe("seo pages", () => {
  it("keeps titles and descriptions inside search-snippet limits", () => {
    for (const page of buildSeoPages(packs)) {
      expect(fullTitle(page.title).length, page.path).toBeLessThanOrEqual(70);
      expect(page.description.length, page.path).toBeLessThanOrEqual(320);
    }
    expect(fullTitle(HOME_TITLE).length).toBeLessThanOrEqual(60);
    expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it("does not repeat the brand in titles that already carry it", () => {
    expect(fullTitle("GradientWall — x")).toBe("GradientWall — x");
    expect(fullTitle("Pack")).toBe("Pack — GradientWall");
  });

  it("makes pack pages indexable once they can be bought, on Etsy or here", () => {
    const pack = { ...packs[0], etsyUrl: undefined, lemonSqueezyVariantId: undefined };
    expect(buildPackPage(pack).noindex).toBe(true);
    expect(buildPackPage({ ...pack, lemonSqueezyVariantId: "123" }).noindex).toBe(false);
    expect(buildPackPage({ ...pack, etsyUrl: "https://www.etsy.com/listing/1" }).noindex).toBe(
      false,
    );
    for (const p of packs) expect(buildPackPage(p).noindex, p.slug).toBe(false);
  });

  it("points a pack sold on Etsy at its listing as the place to buy", () => {
    const pack = { ...packs[0], etsyUrl: "https://www.etsy.com/listing/1" };
    const offer = (buildPackPage(pack).jsonLd?.[0] as { offers: { url: string } }).offers;
    expect(offer.url).toBe("https://www.etsy.com/listing/1");
    const own = { ...pack, lemonSqueezyVariantId: "123" };
    const ownOffer = (buildPackPage(own).jsonLd?.[0] as { offers: { url: string } }).offers;
    expect(ownOffer.url).toBe(absoluteUrl(packPath(pack.slug)));
  });

  it("prerenders the privacy page, indexable and with its own h1", () => {
    const page = buildSeoPages(packs).find((p) => p.path === "/privacy/");
    expect(page).toBeDefined();
    expect(page?.noindex).toBe(false);
    expect(page?.shell.h1).toBe("Privacy");
    expect(renderSitemap(buildSeoPages(packs))).toContain("/privacy/</loc>");
  });

  it("produces one unique path per page", () => {
    const paths = buildSeoPages(packs).map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("renderPage", () => {
  it("writes the page's own tags into the head and its h1 into #root", () => {
    const html = renderPage(TEMPLATE, buildPackPage(packs[0]));
    expect(html).toContain(`<title>${packs[0].name}`);
    expect(html).toContain(
      `<link rel="canonical" href="https://gradientwall-studio.netlify.app/packs/${packs[0].slug}/" />`,
    );
    expect(html).toContain('<meta name="robots" content="index,follow" />');
    expect(html).toContain(`<h1>${packs[0].name}</h1>`);
    expect(html).toContain('<meta name="theme-color" />');
  });

  it("is idempotent over an already-filled template", () => {
    const home = replaceHeadBlock(TEMPLATE, renderHeadTags(buildHomePage()));
    const once = renderPage(home, buildPackPage(packs[0]));
    expect(once.match(/<title>/g)).toHaveLength(1);
    expect(once).not.toContain("Free Gradient Wallpaper Generator");
  });

  it("escapes HTML and cannot break out of the JSON-LD script", () => {
    const page = { ...buildHomePage(), title: 'A "b" <c>', jsonLd: [{ x: "</script><b>" }] };
    const tags = renderHeadTags(page);
    expect(tags).toContain("A &quot;b&quot; &lt;c&gt;");
    expect(tags).not.toContain("</script><b>");
  });

  it("throws when the template lost its markers", () => {
    expect(() => renderPage('<div id="root"></div>', buildHomePage())).toThrow(/seo:start/);
    expect(() => renderPage("<html></html>", buildHomePage())).toThrow(/root/);
  });

  it("canonicalises the 404 page to the home", () => {
    expect(renderHeadTags(NOT_FOUND_PAGE)).toContain(
      'href="https://gradientwall-studio.netlify.app/"',
    );
  });
});

describe("sitemap and output paths", () => {
  it("lists only indexable pages, with absolute URLs", () => {
    const xml = renderSitemap(buildSeoPages(packs));
    expect(xml).toContain("<loc>https://gradientwall-studio.netlify.app/</loc>");
    expect(xml).not.toContain("/recover");
    expect(xml).not.toContain("/legal/");
  });

  it("maps paths to files", () => {
    expect(outputFile(buildHomePage())).toBe("index.html");
    expect(outputFile(NOT_FOUND_PAGE)).toBe("404.html");
    expect(outputFile(buildPackPage(packs[0]))).toBe(`packs/${packs[0].slug}/index.html`);
    expect(outputFile(PRIVACY_PAGE)).toBe("privacy/index.html");
    expect(absoluteUrl("/x")).toBe("https://gradientwall-studio.netlify.app/x");
    expect(absoluteUrl("https://a.b/c")).toBe("https://a.b/c");
  });
});

// Netlify serves `dir/index.html` at `/dir/` and 301-redirects `/dir` there
// ("Pretty URLs"), so every canonical, sitemap entry and internal link must
// carry the trailing slash or it points at a redirect.
describe("trailing slashes", () => {
  it("gives every prerendered page a path that ends in a slash", () => {
    for (const page of [...buildSeoPages(packs), RECOVER_PAGE]) {
      expect(page.path.endsWith("/"), page.path).toBe(true);
    }
    expect(packPath("dessau")).toBe("/packs/dessau/");
  });

  it("writes slash URLs into the sitemap and the pack breadcrumb", () => {
    const xml = renderSitemap(buildSeoPages(packs).map((p) => ({ ...p, noindex: false })));
    for (const loc of xml.match(/<loc>[^<]+<\/loc>/g) ?? []) {
      expect(loc).toMatch(/\/<\/loc>$/);
    }
    const crumbs = JSON.stringify(buildPackPage(packs[0]).jsonLd);
    expect(crumbs).toContain(`/packs/${packs[0].slug}/"`);
    expect(crumbs).not.toContain("#packs");
  });
});

describe("head tags for search and link previews", () => {
  it("lets crawlers follow links on noindex pages", () => {
    expect(renderHeadTags(RECOVER_PAGE)).toContain('content="noindex"');
    expect(renderHeadTags(RECOVER_PAGE)).not.toContain("nofollow");
  });

  it("declares British English, the copy's locale", () => {
    expect(renderHeadTags(buildHomePage())).toContain('og:locale" content="en_GB"');
  });

  it("gives the share image its size and type", () => {
    const home = renderHeadTags(buildHomePage());
    expect(home).toContain('og:image:width" content="1200"');
    expect(home).toContain('og:image:height" content="630"');
    expect(home).toContain('og:image:type" content="image/jpeg"');
    const pack = renderHeadTags(buildPackPage(packs[1]));
    expect(pack).toContain('og:image:width" content="2080"');
    expect(pack).toContain('og:image:type" content="image/png"');
  });

  it("names the site and links the Etsy shop in the home structured data", () => {
    const json = JSON.stringify(HOME_JSON_LD);
    expect(json).toContain('"alternateName"');
    expect(json).toContain("https://gradientwall.etsy.com");
  });

  it("gives each pack Product an absolute image", () => {
    const product = buildPackPage(packs[0]).jsonLd?.[0] as { image?: string[] };
    expect(product.image?.[0]).toBe(absoluteUrl(packs[0].cover.url ?? ""));
  });

  it("links the home shell to every pack", () => {
    const hrefs = (buildHomePage(packs).shell.links ?? []).map((l) => l.href);
    for (const pack of packs) expect(hrefs).toContain(packPath(pack.slug));
  });
});

describe("pack slugs", () => {
  it("names Impasto's URL after the pack and redirects the old one", () => {
    expect(packs.map((p) => p.slug)).toContain("impasto");
    expect(packs.map((p) => p.slug)).not.toContain("acrylic");
    const redirects = readFileSync("public/_redirects", "utf8");
    const toml = readFileSync("netlify.toml", "utf8");
    expect(redirects).toMatch(/^\/packs\/acrylic\/?\*?\s+\/packs\/impasto\/\s+301/m);
    expect(toml).toContain('from = "/packs/acrylic/*"');
  });
});

describe("largest image preload", () => {
  it("preloads the hero phone on the home, with high priority", () => {
    expect(renderHeadTags(buildHomePage())).toContain(
      '<link rel="preload" as="image" href="/assets/hero/phone.webp" fetchpriority="high" />',
    );
    expect(renderHeadTags(PRIVACY_PAGE)).not.toContain('rel="preload"');
  });
});
