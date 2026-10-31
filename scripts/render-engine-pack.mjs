#!/usr/bin/env node
/**
 * Builds the Etsy deliverables of a pack drawn by the Studio's v2 engine
 * (src/lib/packs/engine-packs.ts): each look rendered natively at 1320×2868,
 * 3840×2160 and 5120×2880 (no upscaling), then one ZIP per format. Writes the
 * same layout as scripts/etsy-pack.sh, so scripts/etsy-listing/render.sh works
 * on it unchanged.
 *
 *   npm run dev            # in one terminal
 *   node scripts/render-engine-pack.mjs marble [--url http://127.0.0.1:5173]
 *
 * Output: etsy-out/<slug>/{mobile,4k,5k}/gradientwall-<slug>-NN-<fmt>.jpg + ZIPs.
 * Needs Playwright with a Chromium that has WebGL2 (SwiftShader is fine) and `zip`.
 */
import { execFileSync } from "node:child_process";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");

const slug = process.argv[2];
if (!slug || slug.startsWith("--")) {
  console.error("usage: node scripts/render-engine-pack.mjs <slug> [--url http://127.0.0.1:5173]");
  process.exit(1);
}
const i = process.argv.indexOf("--url");
const url = i > -1 ? process.argv[i + 1] : "http://127.0.0.1:5173";
const QUALITY = 0.92; // etsy-pack.sh exports at 92
const LIMIT = 20 * 1000 * 1000; // Etsy's per-file limit
const out = join("etsy-out", slug);

const browser = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
// Vite may reload the page once while it optimises dependencies.
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.goto(url, { waitUntil: "networkidle" });

const jobs = await page.evaluate(async (slug) => {
  const { getEnginePack, enginePackFile, ENGINE_PACK_SIZES } = await import(
    "/src/lib/packs/engine-packs.ts"
  );
  const pack = getEnginePack(slug);
  if (!pack) return null;
  return pack.pieces.flatMap((piece, index) =>
    Object.entries(ENGINE_PACK_SIZES).map(([format, size]) => ({
      piece,
      size,
      format,
      file: enginePackFile(slug, index, format),
    })),
  );
}, slug);
if (!jobs) {
  console.error(`Unknown engine pack: ${slug}`);
  process.exit(1);
}

for (const job of jobs) {
  const dataUrl = await page.evaluate(
    async ({ job, QUALITY }) => {
      const { renderWallpaperV2 } = await import("/src/lib/gradient-v2/export.ts");
      const art = renderWallpaperV2(job.piece, job.size.w, job.size.h);
      if (!art) throw new Error("WebGL2 not available in this browser");
      return art.toDataURL("image/jpeg", QUALITY);
    },
    { job, QUALITY },
  );
  const path = join(out, job.file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log(`✓ ${path}`);
}
await browser.close();

// One ZIP per format; halves (part1/part2) only when one would pass Etsy's limit.
const zip = async (name, files) => {
  const target = join(out, name);
  await rm(target, { force: true });
  execFileSync("zip", ["-qj", target, ...files]);
  return (await stat(target)).size;
};
let count = 0;
for (const format of ["4k", "5k", "mobile"]) {
  const files = jobs.filter((j) => j.format === format).map((j) => join(out, j.file));
  const name = `gradientwall-${slug}-${format}`;
  await rm(join(out, `${name}-part1.zip`), { force: true });
  await rm(join(out, `${name}-part2.zip`), { force: true });
  if ((await zip(`${name}.zip`, files)) < LIMIT) {
    count += 1;
    continue;
  }
  await rm(join(out, `${name}.zip`));
  const half = Math.ceil(files.length / 2);
  for (const [k, part] of [files.slice(0, half), files.slice(half)].entries()) {
    const size = await zip(`${name}-part${k + 1}.zip`, part);
    if (size >= LIMIT) console.warn(`⚠ ${name}-part${k + 1}.zip is over Etsy's 20 MB limit`);
    count += 1;
  }
}
if (count > 5) console.warn("⚠ more than 5 ZIPs — Etsy allows 5 files per listing");
console.log(`Done → ${out} (${count} ZIPs)`);
