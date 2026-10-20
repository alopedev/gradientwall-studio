// @vitest-environment node
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packsData from "../data/packs.json";
import { coverDisplayWidth, srcSetFor, variantUrl, VARIANT_WIDTHS } from "./responsive-image";

describe("responsive image variants", () => {
  it("names a WebP variant after its source file and width", () => {
    expect(variantUrl("/assets/packs/impasto/01.jpg", 640)).toBe(
      "/assets/packs/impasto/01-640w.webp",
    );
  });

  it("lists the smaller WebP variants plus the original at its own width", () => {
    expect(srcSetFor("/a/b.png", 2080)).toBe(
      "/a/b-640w.webp 640w, /a/b-1280w.webp 1280w, /a/b.png 2080w",
    );
    expect(srcSetFor("/a/b.png", 1000)).toBe("/a/b-640w.webp 640w, /a/b.png 1000w");
  });

  it("sizes a landscape image cropped into a phone by the phone's height", () => {
    expect(coverDisplayWidth(16 / 9, [160, 288])).toBe(512);
    expect(coverDisplayWidth(1 / 2, [160, 288])).toBe(160);
  });

  it("has no srcset for an image without a known width", () => {
    expect(srcSetFor("/a/b.png", undefined)).toBeUndefined();
  });

  it("has every variant the pack manifest needs on disk (run scripts/pack-variants.sh)", () => {
    type Img = { url?: string; width?: number; desktop?: Img };
    const images = (packsData as { cover: Img; previews: Img[] }[])
      .flatMap((p) => [p.cover, ...p.previews])
      .flatMap((i) => (i.desktop ? [i, i.desktop] : [i]));
    for (const img of images) {
      if (!img.url || !img.width) continue;
      for (const w of VARIANT_WIDTHS.filter((v) => v < (img.width ?? 0))) {
        const file = `public${variantUrl(img.url, w)}`;
        expect(existsSync(file), file).toBe(true);
      }
    }
  });
});
