import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_SIZE,
  fullTitle,
  SITE_NAME,
  SITE_ORIGIN,
  type SeoPage,
} from "./pages";

export const HEAD_START = "<!--seo:start-->";
export const HEAD_END = "<!--seo:end-->";
const ROOT_EMPTY = '<div id="root"></div>';

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** MIME type from the file extension, or undefined for an unknown one. */
const imageType = (url: string) => IMAGE_TYPES[url.split(".").pop()?.toLowerCase() ?? ""];

/** `<` escaped so a JSON string can never close the script tag. */
const jsonForScript = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

/** The page-specific `<head>` tags: title, description, canonical, robots, OG, Twitter, JSON-LD. */
export function renderHeadTags(page: SeoPage): string {
  const title = escapeHtml(fullTitle(page.title));
  const description = escapeHtml(page.description);
  const url = escapeHtml(absoluteUrl(page.path === "/404" ? "/" : page.path));
  const image = escapeHtml(absoluteUrl(page.ogImage ?? DEFAULT_OG_IMAGE));
  const alt = page.ogImageAlt ? escapeHtml(page.ogImageAlt) : "";
  const size = page.ogImage ? page.ogImageSize : DEFAULT_OG_SIZE;
  const type = imageType(page.ogImage ?? DEFAULT_OG_IMAGE);

  const lines = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="${page.noindex ? "noindex" : "index,follow"}" />`,
    `<meta property="og:type" content="${page.ogType}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    ...(size
      ? [
          `<meta property="og:image:width" content="${size.width}" />`,
          `<meta property="og:image:height" content="${size.height}" />`,
        ]
      : []),
    ...(type ? [`<meta property="og:image:type" content="${type}" />`] : []),
    ...(alt ? [`<meta property="og:image:alt" content="${alt}" />`] : []),
    `<meta property="og:locale" content="en_GB" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    ...(alt ? [`<meta name="twitter:image:alt" content="${alt}" />`] : []),
    ...(page.preloadImage
      ? [
          `<link rel="preload" as="image" href="${escapeHtml(page.preloadImage)}" fetchpriority="high" />`,
        ]
      : []),
    ...(page.jsonLd
      ? [
          `<script type="application/ld+json" data-prerender="true">${jsonForScript(page.jsonLd)}</script>`,
        ]
      : []),
  ];
  return lines.map((l) => `    ${l}`).join("\n");
}

/**
 * Crawlable content for `#root`. Visually hidden: React replaces it on mount
 * (`createRoot`, no hydration), so it never flashes nor mismatches.
 */
export function renderShell(page: SeoPage): string {
  const { h1, text, links = [] } = page.shell;
  const nav = links.length
    ? `<nav>${links.map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`).join(" ")}</nav>`
    : "";
  const style =
    "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
  return `<div id="root"><main data-prerender style="${style}"><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(text)}</p>${nav}</main></div>`;
}

/** Replace whatever sits between the SEO markers with `tags`. */
export function replaceHeadBlock(html: string, tags: string): string {
  const start = html.indexOf(HEAD_START);
  const end = html.indexOf(HEAD_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`index.html is missing the ${HEAD_START} … ${HEAD_END} block`);
  }
  return `${html.slice(0, start)}${HEAD_START}\n${tags}\n    ${HEAD_END}${html.slice(end + HEAD_END.length)}`;
}

/** Swap the SEO head block and the `#root` placeholder of a built `index.html`. */
export function renderPage(template: string, page: SeoPage): string {
  if (!template.includes(ROOT_EMPTY)) {
    throw new Error(`index.html is missing ${ROOT_EMPTY}`);
  }
  return replaceHeadBlock(template, renderHeadTags(page)).replace(ROOT_EMPTY, renderShell(page));
}

/** Sitemap with every indexable page. No `lastmod`: a fake build date is worse than none. */
export function renderSitemap(pages: SeoPage[]): string {
  const urls = pages
    .filter((p) => !p.noindex)
    .map((p) => `  <url>\n    <loc>${SITE_ORIGIN}${p.path}</loc>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

/** Output path (relative to `dist/`) for a page. */
export function outputFile(page: SeoPage): string {
  if (page.path === "/") return "index.html";
  if (page.path === "/404") return "404.html";
  return `${page.path.slice(1)}index.html`;
}
