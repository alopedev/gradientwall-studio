#!/usr/bin/env node
/**
 * Renders the landing galleries (src/lib/seo/gallery.ts) with the site's own
 * v2 shader: per piece a master JPEG plus its WebP widths, and per landing a
 * 1200x630 share image (og.jpg) from its first piece. Files land in
 * public/assets/gallery/<landing>/; existing ones are skipped (--force redoes).
 *
 *   npm run dev            # in one terminal
 *   node scripts/render-gallery.mjs [--force] [--url http://127.0.0.1:5173]
 *
 * Needs Playwright with a Chromium that has WebGL2 (SwiftShader is fine). Not
 * part of the build: run it by hand when a gallery changes, and commit the files.
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const url = arg("url", "http://127.0.0.1:5173");
const force = process.argv.includes("--force");
const OG = { w: 1200, h: 630 };

const browser = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
// Vite may reload the page once while it optimises dependencies.
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.goto(url, { waitUntil: "networkidle" });

const jobs = await page.evaluate(async () => {
  const { LANDINGS } = await import("/src/lib/seo/landings.ts");
  const { galleryFor, galleryShape, GALLERY_FILES } = await import("/src/lib/seo/gallery.ts");
  return LANDINGS.flatMap((landing) => {
    const images = galleryFor(landing);
    if (!images.length) return [];
    const { w, h, widths } = GALLERY_FILES[galleryShape(landing)];
    return [
      {
        og: `/assets/gallery/${landing.slug}/og.jpg`,
        images: images.map((img) => ({ src: img.src, look: img.piece, w, h, widths })),
      },
    ];
  });
});

const out = (src) => join("public", src);
const save = async (src, dataUrl) => {
  await mkdir(dirname(out(src)), { recursive: true });
  await writeFile(out(src), Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log(`wrote ${out(src)}`);
};

for (const job of jobs) {
  for (const [i, img] of job.images.entries()) {
    const targets = [img.src, ...img.widths.map((x) => img.src.replace(/\.jpg$/, `-${x}w.webp`))];
    const og = i === 0 ? job.og : null;
    if (!force && [...targets, ...(og ? [og] : [])].every((t) => existsSync(out(t)))) continue;
    const files = await page.evaluate(
      async ({ img, og, OG }) => {
        const { renderWallpaperV2 } = await import("/src/lib/gradient-v2/export.ts");
        const art = renderWallpaperV2(img.look, img.w, img.h);
        if (!art) throw new Error("WebGL2 not available in this browser");
        const scaled = (w, h, from = art) => {
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const ctx = c.getContext("2d");
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(from, 0, 0, w, h);
          return c;
        };
        const result = [art.toDataURL("image/jpeg", 0.88)];
        for (const x of img.widths) {
          const c = x === img.w ? art : scaled(x, Math.round((img.h * x) / img.w));
          result.push(c.toDataURL("image/webp", 0.82));
        }
        if (og) {
          // Same look drawn at the share size, so it isn't a stretched crop.
          const share = renderWallpaperV2(img.look, OG.w, OG.h);
          result.push(share.toDataURL("image/jpeg", 0.88));
        }
        return result;
      },
      { img, og, OG },
    );
    for (const [k, t] of targets.entries()) await save(t, files[k]);
    if (og) await save(og, files[targets.length]);
  }
}

await browser.close();
