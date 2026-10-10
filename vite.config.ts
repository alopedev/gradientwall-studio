import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildHomePage, buildSeoPages, NOT_FOUND_PAGE, type SeoPack } from "./src/lib/seo/pages";
import {
  outputFile,
  renderHeadTags,
  renderPage,
  renderSitemap,
  replaceHeadBlock,
} from "./src/lib/seo/render";

/**
 * SEO build step. The app is a client-rendered SPA, so crawlers and link
 * unfurlers (which often don't run JS) would see the same `index.html` for
 * every URL. After the bundle is written we reuse the built `index.html` as a
 * template and emit one file per route with its own title, description,
 * canonical, robots, Open Graph and JSON-LD (plus a visually hidden h1/intro
 * that React replaces on mount), a `404.html` and `sitemap.xml`.
 *
 * The data comes from `src/lib/seo/pages.ts`, the same module `PageMeta` uses
 * at runtime, and the pack list from `src/data/packs.json`, so adding a pack to
 * the manifest is the only step needed to get its page prerendered.
 */
function seoPlugin(): Plugin {
  const readPacks = () =>
    JSON.parse(
      readFileSync(fileURLToPath(new URL("./src/data/packs.json", import.meta.url)), "utf8"),
    ) as SeoPack[];
  let outDir = "dist";

  return {
    name: "gradientwall-seo",
    configResolved(config) {
      outDir = fileURLToPath(new URL(config.build.outDir, `file://${config.root}/`));
    },
    // Dev server + build: fill the marker block with the home page tags.
    transformIndexHtml(html) {
      return replaceHeadBlock(html, renderHeadTags(buildHomePage()));
    },
    closeBundle() {
      // Runs for `vite build` only (vitest has no bundle to post-process).
      if (!existsSync(join(outDir, "index.html"))) return;
      const template = readFileSync(join(outDir, "index.html"), "utf8");
      const pages = buildSeoPages(readPacks());
      for (const page of [...pages, NOT_FOUND_PAGE]) {
        const file = join(outDir, outputFile(page));
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, renderPage(template, page));
      }
      writeFileSync(join(outDir, "sitemap.xml"), renderSitemap(pages));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    // Allow the Vite dev server to be served via a public Cloudflare Tunnel for
    // mobile / remote testing. Restrict to .trycloudflare.com subdomains only.
    allowedHosts: [".trycloudflare.com"],
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "netlify/**/*.test.ts"],
    globals: false,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    // Functions run in Node serverless — netlify/**/*.test.ts files declare
    // `// @vitest-environment node` on line 1 so jose/crypto behave as at
    // runtime (jsdom's TextEncoder yields a Uint8Array jose v5 rejects).
  },
});
