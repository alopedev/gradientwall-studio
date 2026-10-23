// @vitest-environment node
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packsData from "../data/packs.json";
import {
  coverDisplayWidth,
  PHONE_CROP,
  phoneCropFor,
  phoneCropUrl,
  srcSetFor,
  variantUrl,
  VARIANT_WIDTHS,
} from "./responsive-image";

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

  it("serves a landscape image in a small phone as its centre crop", () => {
    expect(phoneCropUrl("/a/01.jpg")).toBe("/a/01-phone.webp");
    expect(phoneCropFor({ url: "/a/01.jpg", width: 1600, height: 900 }, [160, 300])).toEqual({
      url: "/a/01-phone.webp",
      ...PHONE_CROP,
    });
    // Portrait files, landscape boxes and phones too tall for the crop keep the srcset.
    expect(phoneCropFor({ url: "/a/b.png", width: 1320, height: 2868 }, [160, 300])).toBeNull();
    expect(phoneCropFor({ url: "/a/01.jpg", width: 1600, height: 900 }, [900, 563])).toBeNull();
    expect(phoneCropFor({ url: "/a/01.jpg", width: 1600, height: 900 }, [250, 540])).toBeNull();
    expect(
      phoneCropFor({ url: "/a/01_x-desktop.png", width: 2560, height: 1440 }, [160, 300]),
    ).toBeNull();
    // A source smaller than the crop can't give one.
    expect(phoneCropFor({ url: "/a/s.jpg", width: 800, height: 450 }, [160, 300])).toBeNull();
  });

  it("has no srcset for an image without a known width", () => {
    expect(srcSetFor("/a/b.png", undefined)).toBeUndefined();
  });

  it("has every variant the pack manifest needs on disk (run scripts/pack-variants.sh)", () => {
    type Img = { url?: string; width?: number; height?: number; desktop?: Img };
    const images = (packsData as { cover: Img; previews: Img[] }[])
      .flatMap((p) => [p.cover, ...p.previews])
      .flatMap((i) => (i.desktop ? [i, i.desktop] : [i]));
    for (const img of images) {
      if (!img.url || !img.width) continue;
      for (const w of VARIANT_WIDTHS.filter((v) => v < (img.width ?? 0))) {
        const file = `public${variantUrl(img.url, w)}`;
        expect(existsSync(file), file).toBe(true);
      }
      const crop = phoneCropFor({ url: img.url, width: img.width, height: img.height }, [160, 300]);
      if (crop) expect(existsSync(`public${crop.url}`), crop.url).toBe(true);
    }
  });
});
