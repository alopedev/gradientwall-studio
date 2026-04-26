import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

const SITE_ORIGIN = "https://gradientwall.com";

/**
 * Build-time sitemap generator. Reads `src/data/packs.json` and writes
 * `dist/sitemap.xml` covering the static routes plus one entry per pack.
 * Regenerates automatically on every `npm run build`, so adding a pack to
 * the manifest is the only step needed to keep search engines in sync.
 */
function sitemapPlugin(): Plugin {
  return {
    name: "gradientwall-sitemap",
    apply: "build",
    generateBundle() {
      type Pack = { slug: string };
      const manifestPath = fileURLToPath(new URL("./src/data/packs.json", import.meta.url));
      const packs = JSON.parse(readFileSync(manifestPath, "utf8")) as Pack[];

      const today = new Date().toISOString().slice(0, 10);
      const urls = [
        { loc: "/", changefreq: "weekly", priority: "1.0" },
        ...packs.map((p) => ({ loc: `/packs/${p.slug}`, changefreq: "monthly", priority: "0.8" })),
        { loc: "/legal/terms", changefreq: "yearly", priority: "0.3" },
        { loc: "/legal/privacy", changefreq: "yearly", priority: "0.3" },
      ];

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls
          .map(
            ({ loc, changefreq, priority }) =>
              `  <url>\n    <loc>${SITE_ORIGIN}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
          )
          .join("\n") +
        `\n</urlset>\n`;

      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: xml });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sitemapPlugin()],
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
