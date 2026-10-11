#!/usr/bin/env node
/**
 * Renders public/og-default.jpg (1200x630) with the site's own v2 shader, so
 * the share image carries the same look as the Studio, then writes the page
 * title over it in the site's fonts.
 *
 *   npm run dev            # in one terminal
 *   node scripts/render-og.mjs [--seed N] [--out path] [--url http://127.0.0.1:5173]
 *
 * Needs Playwright with a Chromium that has WebGL2 (SwiftShader is fine) and
 * network access for Google Fonts. Not part of the build: run it by hand when
 * the look or the headline changes, and commit the JPEG.
 */
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const url = arg("url", "http://127.0.0.1:5173");
const out = arg("out", "public/og-default.jpg");
const seed = Number(arg("seed", "7"));

const W = 1200;
const H = 630;
const SCALE = 2; // render at 2x and downsample: smoother grain, sharper text

const browser = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
await page.goto(url, { waitUntil: "load" });

const dataUrl = await page.evaluate(
  async ({ W, H, SCALE, seed }) => {
    const { renderWallpaperV2 } = await import("/src/lib/gradient-v2/export.ts");
    const { PALETTES } = await import("/src/lib/palettes.ts");
    await document.fonts.load("700 80px 'Space Grotesk'");
    await document.fonts.load("italic 400 80px 'Instrument Serif'");
    await document.fonts.load("500 22px 'Space Grotesk'");

    const palette = PALETTES.find((p) => p.name === "Dusk");
    const art = renderWallpaperV2(
      { colors: palette.colors, style: "liquid", seed, lightAngle: 315, grain: 45 },
      W * SCALE,
      H * SCALE,
    );
    if (!art) throw new Error("WebGL2 not available in this browser");

    const c = document.createElement("canvas");
    c.width = W * SCALE;
    c.height = H * SCALE;
    const ctx = c.getContext("2d");
    ctx.drawImage(art, 0, 0);

    // Darken the bottom so the headline reads on any frame of the gradient.
    const g = ctx.createLinearGradient(0, c.height * 0.45, 0, c.height);
    g.addColorStop(0, "rgba(8,6,16,0)");
    g.addColorStop(1, "rgba(8,6,16,0.62)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);

    const S = SCALE;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#fff";

    ctx.font = `500 ${22 * S}px 'Space Grotesk'`;
    ctx.letterSpacing = `${4 * S}px`;
    ctx.globalAlpha = 0.9;
    ctx.fillText("GRADIENTWALL", 72 * S, 96 * S);
    ctx.globalAlpha = 1;

    ctx.letterSpacing = `${-3 * S}px`;
    ctx.font = `700 ${92 * S}px 'Space Grotesk'`;
    ctx.fillText("FREE GRADIENT", 72 * S, 470 * S);
    // Second line: sans word + serif italic accent, as in the site's headlines.
    ctx.font = `700 ${92 * S}px 'Space Grotesk'`;
    const first = "WALLPAPER ";
    ctx.fillText(first, 72 * S, 562 * S);
    const x = 72 * S + ctx.measureText(first).width;
    ctx.letterSpacing = `${-2 * S}px`;
    ctx.font = `italic 400 ${104 * S}px 'Instrument Serif'`;
    ctx.fillText("generator.", x, 562 * S);

    const o = document.createElement("canvas");
    o.width = W;
    o.height = H;
    const octx = o.getContext("2d");
    octx.imageSmoothingQuality = "high";
    octx.drawImage(c, 0, 0, W, H);
    return o.toDataURL("image/jpeg", 0.9);
  },
  { W, H, SCALE, seed },
);

await writeFile(out, Buffer.from(dataUrl.split(",")[1], "base64"));
console.log(`wrote ${out} (seed ${seed})`);
await browser.close();
