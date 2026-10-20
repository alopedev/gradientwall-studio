import { describe, it, expect } from "vitest";
import { getPackBySlug } from "./index";
import {
  coverRenders,
  fanPieces,
  pieceName,
  pieceRenders,
  packSpecs,
  showcaseViews,
  shuffleIndex,
} from "./showcase";
import type { PackCover, Pack } from "./types";

const phoneOnly: PackCover = { kind: "image", url: "/p.png", alt: "p", width: 1170, height: 2080 };
const landscapeOnly: PackCover = {
  kind: "image",
  url: "/l.jpg",
  alt: "l",
  width: 1600,
  height: 900,
};
const pair: PackCover = {
  kind: "image",
  url: "/pair.png",
  alt: "phone",
  width: 1170,
  height: 2080,
  desktop: { url: "/pair-d.png", alt: "desktop", width: 2080, height: 1170 },
};

describe("pieceRenders", () => {
  it("uses the composed phone and desktop files of a pair, no crop", () => {
    const r = pieceRenders(pair);
    expect(r.phone).toMatchObject({ kind: "image", url: "/pair.png" });
    expect(r.desktop).toMatchObject({ kind: "image", url: "/pair-d.png", width: 2080 });
    expect(r.phoneIsCrop).toBe(false);
  });

  it("does not leak the nested desktop into the phone render", () => {
    expect(pieceRenders(pair).phone).not.toHaveProperty("desktop");
  });

  it("shows a landscape-only piece on both devices and flags the phone as a centre crop", () => {
    const r = pieceRenders(landscapeOnly);
    expect(r.desktop).toBe(landscapeOnly);
    expect(r.phone).toBe(landscapeOnly);
    expect(r.phoneIsCrop).toBe(true);
  });

  it("has no desktop render for a portrait-only piece", () => {
    const r = pieceRenders(phoneOnly);
    expect(r.phone).toBe(phoneOnly);
    expect(r.desktop).toBeNull();
    expect(r.phoneIsCrop).toBe(false);
  });
});

describe("coverRenders", () => {
  it("builds a catalog cover from the first piece of each real pack", () => {
    const dessau = coverRenders(getPackBySlug("dessau")!);
    expect(dessau.phone).toMatchObject({ url: "/assets/packs/dessau/01_kreise.png" });
    expect(dessau.desktop).toMatchObject({ url: "/assets/packs/dessau/01_kreise-desktop.png" });

    const impasto = coverRenders(getPackBySlug("impasto")!);
    expect(impasto.phone).toMatchObject({ url: "/assets/packs/acrylic/01.jpg" });
    expect(impasto.desktop).toMatchObject({ url: "/assets/packs/acrylic/01.jpg" });
  });
});

describe("packSpecs", () => {
  const byLabel = (slug: string) =>
    Object.fromEntries(packSpecs(getPackBySlug(slug)!).map((s) => [s.label, s]));

  it("counts files from the manifest, not from copy", () => {
    expect(byLabel("impasto").Phone.value).toBe("10 × iPhone & Android");
    expect(byLabel("impasto").Desktop.value).toBe("10 × 4K and 5K");
    expect(byLabel("dessau").Phone.value).toBe("6 × iPhone & Android");
    expect(byLabel("dessau").Desktop.value).toBe("6 × 4K and 5K");
  });

  it("gives the exact pixel sizes", () => {
    expect(byLabel("dessau").Phone.detail).toBe("1320 × 2868");
    expect(byLabel("dessau").Desktop.detail).toBe("3840 × 2160 · 5120 × 2880");
  });

  it("states format and licence", () => {
    expect(byLabel("dessau").Format.value).toMatch(/JPG/);
    expect(byLabel("dessau").Licence.value).toMatch(/personal use/i);
  });

  it("falls back to a single file count for packs that are not phone + desktop", () => {
    const single = {
      previews: [landscapeOnly, landscapeOnly, landscapeOnly],
    } as Pick<Pack, "previews" | "phoneAndDesktop">;
    const labels = packSpecs(single).map((s) => s.label);
    expect(labels).toEqual(["Files", "Format", "Licence"]);
    expect(packSpecs(single)[0].value).toBe("3 wallpapers");
  });
});

describe("showcaseViews", () => {
  const pack = (previews: PackCover[]) => ({ previews }) as Pick<Pack, "previews">;

  it("opens on both devices, then each one alone, when pieces have a desktop render", () => {
    expect(showcaseViews(pack([pair]))).toEqual(["both", "phone", "desktop"]);
    expect(showcaseViews(pack([landscapeOnly]))).toEqual(["both", "phone", "desktop"]);
  });

  it("offers only the phone for portrait-only packs", () => {
    expect(showcaseViews(pack([phoneOnly]))).toEqual(["phone"]);
  });
});

describe("pieceName", () => {
  it("reads the design name from a numbered file like 01_kreise.png", () => {
    expect(pieceName(pair)).toBeNull();
    expect(pieceName({ ...phoneOnly, url: "/assets/packs/dessau/06_halbkreise.png" })).toBe(
      "Halbkreise",
    );
  });

  it("has no name for a bare number or a gradient", () => {
    expect(pieceName({ ...landscapeOnly, url: "/assets/packs/acrylic/03.jpg" })).toBeNull();
    expect(getPackBySlug("dessau")!.previews.map(pieceName)).toEqual([
      "Kreise",
      "Rot",
      "Schwarz",
      "Gelb",
      "Sonne",
      "Halbkreise",
    ]);
  });
});

describe("shuffleIndex", () => {
  it("always lands on a different piece", () => {
    for (const r of [0, 0.2, 0.5, 0.99]) {
      const next = shuffleIndex(2, 6, () => r);
      expect(next).not.toBe(2);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(6);
    }
  });

  it("stays put when there is nothing else to show", () => {
    expect(shuffleIndex(0, 1, () => 0.5)).toBe(0);
  });
});

describe("fanPieces", () => {
  const pieces = (n: number): PackCover[] =>
    Array.from({ length: n }, (_, i) => ({ ...pair, url: `/${i + 1}.png`, alt: `piece ${i + 1}` }));

  it("fans at most five phones, centred, with the cover piece on top in the middle", () => {
    const fan = fanPieces({ previews: pieces(10) });
    expect(fan.map((f) => f.offset)).toEqual([-2, -1, 0, 1, 2]);
    const middle = fan.find((f) => f.offset === 0)!;
    expect(middle.cover).toMatchObject({ url: "/1.png" });
    expect(new Set(fan.map((f) => f.cover.kind === "image" && f.cover.url)).size).toBe(5);
  });

  it("keeps the fan centred when a pack has fewer pieces", () => {
    expect(fanPieces({ previews: pieces(3) }).map((f) => f.offset)).toEqual([-1, 0, 1]);
    expect(fanPieces({ previews: pieces(1) }).map((f) => f.offset)).toEqual([0]);
  });

  it("shows the phone render of each piece, never the nested desktop file", () => {
    for (const f of fanPieces({ previews: pieces(4) }))
      expect(f.cover).not.toHaveProperty("desktop");
  });

  it("fans a landscape-only pack too (the phone crops it, as its real file is cut)", () => {
    const fan = fanPieces(getPackBySlug("impasto")!);
    expect(fan).toHaveLength(5);
    expect(fan[2].cover).toMatchObject({ url: "/assets/packs/acrylic/01.jpg" });
  });
});
