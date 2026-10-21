import { build, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
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
 *
 * Each page's `#root` holds the page itself, rendered by `src/entry-server.tsx`
 * (a second, SSR build of the same app), so the hero paints from the HTML and
 * `main.tsx` hydrates it instead of drawing it from scratch. The 404 keeps the
 * hidden shell: its app only redirects home.
 */
function seoPlugin(): Plugin {
  const readPacks = () =>
    JSON.parse(
      readFileSync(fileURLToPath(new URL("./src/data/packs.json", import.meta.url)), "utf8"),
    ) as SeoPack[];
  let outDir = "dist";
  let root = process.cwd();
  let mode = "production";
  let isSsrBuild = false;

  /** Build `entry-server.tsx` for Node and load its `render`. */
  async function loadRenderer(): Promise<(url: string) => Promise<string>> {
    const ssrDir = join(root, "node_modules/.prerender");
    rmSync(ssrDir, { recursive: true, force: true });
    await build({
      root,
      mode,
      logLevel: "warn",
      build: { ssr: "src/entry-server.tsx", outDir: ssrDir, emptyOutDir: true },
    });
    const mod = await import(pathToFileURL(join(ssrDir, "entry-server.js")).href);
    return mod.render;
  }

  return {
    name: "gradientwall-seo",
    configResolved(config) {
      outDir = fileURLToPath(new URL(config.build.outDir, `file://${config.root}/`));
      root = config.root;
      mode = config.mode;
      isSsrBuild = Boolean(config.build.ssr);
    },
    // Dev server + build: fill the marker block with the home page tags.
    transformIndexHtml(html) {
      return replaceHeadBlock(html, renderHeadTags(buildHomePage()));
    },
    async closeBundle() {
      // Runs for the client `vite build` only (vitest has no bundle to
      // post-process, and the SSR build below must not recurse).
      if (isSsrBuild || !existsSync(join(outDir, "index.html"))) return;
      const template = readFileSync(join(outDir, "index.html"), "utf8");
      const pages = buildSeoPages(readPacks());
      const render = await loadRenderer();
      for (const page of pages) {
        const file = join(outDir, outputFile(page));
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, renderPage(template, page, await render(page.path)));
      }
      writeFileSync(join(outDir, outputFile(NOT_FOUND_PAGE)), renderPage(template, NOT_FOUND_PAGE));
      writeFileSync(join(outDir, "sitemap.xml"), renderSitemap(pages));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin()],
  build: {
    // Hashed bundles go to /static/ (cached for a year in public/_headers), apart
    // from public/assets/, whose pack images keep their names across builds.
    assetsDir: "static",
  },
  // The prerender's SSR build: react-router-dom's Node entry is CommonJS that
  // re-exports react-router, so bundle both and pick their ESM files.
  ssr: { noExternal: [/react-router/], resolve: { conditions: ["module-sync"] } },
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
