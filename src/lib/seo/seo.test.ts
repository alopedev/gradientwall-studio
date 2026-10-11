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
  NOT_FOUND_PAGE,
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

  it("makes pack pages indexable only once they can be bought", () => {
    const pack = packs[0];
    expect(buildPackPage({ ...pack, lemonSqueezyVariantId: undefined }).noindex).toBe(true);
    expect(buildPackPage({ ...pack, lemonSqueezyVariantId: "123" }).noindex).toBe(false);
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
      `<link rel="canonical" href="https://gradientwall.com/packs/${packs[0].slug}" />`,
    );
    expect(html).toContain('<meta name="robots" content="noindex,nofollow" />');
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
    expect(renderHeadTags(NOT_FOUND_PAGE)).toContain('href="https://gradientwall.com/"');
  });
});

describe("sitemap and output paths", () => {
  it("lists only indexable pages, with absolute URLs", () => {
    const xml = renderSitemap(buildSeoPages(packs));
    expect(xml).toContain("<loc>https://gradientwall.com/</loc>");
    expect(xml).not.toContain("/recover");
    expect(xml).not.toContain("/legal/");
  });

  it("maps paths to files", () => {
    expect(outputFile(buildHomePage())).toBe("index.html");
    expect(outputFile(NOT_FOUND_PAGE)).toBe("404.html");
    expect(outputFile(buildPackPage(packs[0]))).toBe(`packs/${packs[0].slug}/index.html`);
    expect(absoluteUrl("/x")).toBe("https://gradientwall.com/x");
    expect(absoluteUrl("https://a.b/c")).toBe("https://a.b/c");
  });
});
