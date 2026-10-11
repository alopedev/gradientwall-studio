import { describe, it, expect } from "vitest";
import { getPackBySlug } from "./index";
import { coverRenders, pieceRenders, packSpecs, showcaseDevices } from "./showcase";
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

describe("showcaseDevices", () => {
  const pack = (previews: PackCover[]) => ({ previews }) as Pick<Pack, "previews">;

  it("offers phone and desktop when pieces have both", () => {
    expect(showcaseDevices(pack([pair, pair]))).toEqual(["phone", "desktop"]);
    expect(showcaseDevices(pack([landscapeOnly]))).toEqual(["phone", "desktop"]);
  });

  it("offers only the phone for portrait-only packs", () => {
    expect(showcaseDevices(pack([phoneOnly]))).toEqual(["phone"]);
  });
});

describe("coverRenders", () => {
  it("builds a catalog cover from the first piece of each real pack", () => {
    const dessau = coverRenders(getPackBySlug("dessau")!);
    expect(dessau.phone).toMatchObject({ url: "/assets/packs/dessau/01_kreise.png" });
    expect(dessau.desktop).toMatchObject({ url: "/assets/packs/dessau/01_kreise-desktop.png" });

    const impasto = coverRenders(getPackBySlug("acrylic")!);
    expect(impasto.phone).toMatchObject({ url: "/assets/packs/acrylic/01.jpg" });
    expect(impasto.desktop).toMatchObject({ url: "/assets/packs/acrylic/01.jpg" });
  });
});

describe("packSpecs", () => {
  const byLabel = (slug: string) =>
    Object.fromEntries(packSpecs(getPackBySlug(slug)!).map((s) => [s.label, s]));

  it("counts files from the manifest, not from copy", () => {
    expect(byLabel("acrylic").Phone.value).toBe("10 × iPhone & Android");
    expect(byLabel("acrylic").Desktop.value).toBe("10 × 4K and 5K");
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
