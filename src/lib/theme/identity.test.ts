// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Identity B ("Dessau paper", 2026-10-12) keeps out the traits that read as
 * AI-made: glass, the gold accent, the serif italic accent word and Space
 * Grotesk. White is only for things drawn on top of a wallpaper (a lock
 * screen, a device bezel, an icon over a swatch), listed below.
 */
const ROOT = new URL("../../", import.meta.url).pathname;
const ON_WALLPAPER = new Set([
  "components/studio/v2/DeviceStage.tsx",
  "components/studio/v2/FavoriteThumbnail.tsx",
  "components/studio/v2/ColorEditor.tsx",
  "components/packs/DeviceFrames.tsx",
]);

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

const files = sources(join(ROOT, "components")).map((path) => ({
  rel: relative(ROOT, path),
  text: readFileSync(path, "utf8"),
}));

function offenders(pattern: RegExp, allow: Set<string> = new Set()): string[] {
  return files.filter((f) => !allow.has(f.rel) && pattern.test(f.text)).map((f) => f.rel);
}

describe("identity B: paper, ink, no AI tells", () => {
  it("uses no glass outside the phone it draws (backdrop blur, liquid utilities)", () => {
    expect(
      offenders(/backdrop-blur|backdrop-filter|liquid-(subtle|pill)|glass-modern/, ON_WALLPAPER),
    ).toEqual([]);
  });

  it("has no gold accent and no serif italic voice", () => {
    expect(offenders(/\bgold\b|font-serif|Instrument Serif|Space Grotesk/)).toEqual([]);
  });

  it("paints white only on top of a wallpaper", () => {
    expect(offenders(/\b(text|bg|border)-white\b|#fff\b|#ffffff/i, ON_WALLPAPER)).toEqual([]);
  });

  it("loads only the identity's two faces", () => {
    // Self-hosted in public/fonts/, declared in index.css, preloaded in index.html.
    const fonts = readdirSync(join(ROOT, "../public/fonts")).filter((f) => f.endsWith(".woff2"));
    expect(new Set(fonts.map((f) => f.replace(/-latin(-ext)?\.woff2$/, "")))).toEqual(
      new Set(["albert-sans", "jost"]),
    );
    const css = readFileSync(join(ROOT, "index.css"), "utf8");
    const families = new Set([...css.matchAll(/font-family: "([^"]+)"/g)].map((m) => m[1]));
    expect(families).toEqual(new Set(["Albert Sans", "Jost"]));
    const html = readFileSync(join(ROOT, "../index.html"), "utf8");
    expect(html).toContain('href="/fonts/albert-sans-latin.woff2"');
    expect(html).toContain('href="/fonts/jost-latin.woff2"');
  });
});
