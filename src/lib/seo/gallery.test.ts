import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { decodeLookParam } from "../look-url";
import { GALLERIES, GALLERY_FILES, galleryFor, galleryShape } from "./gallery";
import { LANDINGS } from "./landings";

const publicFile = (url: string) => resolve(__dirname, "../../../public", url.replace(/^\//, ""));

describe("landing galleries", () => {
  it("only name landings that exist", () => {
    const slugs = LANDINGS.map((l) => l.slug);
    for (const slug of Object.keys(GALLERIES)) expect(slugs).toContain(slug);
  });

  describe.each(LANDINGS.filter((l) => GALLERIES[l.slug]))("$slug", (landing) => {
    const images = galleryFor(landing);

    it("has 12 to 24 wallpapers", () => {
      expect(images.length).toBeGreaterThanOrEqual(12);
      expect(images.length).toBeLessThanOrEqual(24);
    });

    it("gives each its own alt text and file", () => {
      expect(new Set(images.map((i) => i.alt)).size).toBe(images.length);
      expect(new Set(images.map((i) => i.src)).size).toBe(images.length);
    });

    it("keeps to the landing's own style and grain", () => {
      for (const { piece } of images) {
        if (landing.look.style) expect(piece.style).toBe(landing.look.style);
        if (landing.look.grain !== undefined) expect(piece.grain).toBe(landing.look.grain);
      }
    });

    it("links each one to the Studio with its exact look", () => {
      for (const { piece, studioHref } of images) {
        const url = new URL(studioHref, "https://gradientwall.app");
        expect(url.hash).toBe("#studio");
        const { name: _name, ...look } = piece;
        expect(decodeLookParam(url.searchParams.get("w") ?? "")).toEqual(look);
      }
    });

    it("has its files in public/ (run scripts/render-gallery.mjs)", () => {
      expect(existsSync(publicFile(`/assets/gallery/${landing.slug}/og.jpg`))).toBe(true);
      const { widths } = GALLERY_FILES[galleryShape(landing)];
      for (const img of images) {
        expect(existsSync(publicFile(img.src)), img.src).toBe(true);
        for (const w of widths) {
          const webp = img.src.replace(/\.jpg$/, `-${w}w.webp`);
          expect(existsSync(publicFile(webp)), webp).toBe(true);
        }
      }
    });
  });

  it("writes alt text that names what you see", () => {
    const iphone = LANDINGS.find((l) => l.slug === "iphone-gradient-wallpapers")!;
    expect(galleryFor(iphone)[0].alt).toBe("Olive and lemon mesh gradient iPhone wallpaper");
    const grainy = LANDINGS.find((l) => l.slug === "grainy-gradient-wallpapers")!;
    expect(galleryFor(grainy)[0].alt).toMatch(
      /^Plum and amber grainy mesh gradient phone wallpaper$/,
    );
  });
});
