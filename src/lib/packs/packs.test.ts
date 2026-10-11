import { describe, it, expect } from "vitest";
import {
  getPacks,
  getPackBySlug,
  filterPacks,
  availableStyles,
  coverAspect,
  describeContents,
  pieceAspect,
  PACK_STYLES,
} from "./index";
import type { Pack } from "./types";

describe("packs catalog", () => {
  const all = getPacks();

  it("manifest is non-empty", () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it("every pack has a unique slug", () => {
    const slugs = all.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every pack passes the schema invariants", () => {
    for (const p of all) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(p.name.length).toBeGreaterThan(0);
      expect(PACK_STYLES).toContain(p.style);
      expect(p.tagline.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.priceEur).toBeGreaterThan(0);
      expect(p.previews.length).toBeGreaterThan(0);
      expect(p.cover).toBeDefined();
      assertCover(p.cover);
      for (const preview of p.previews) assertCover(preview);
    }
  });
});

describe("Dessau (phone + desktop pieces)", () => {
  const dessau = getPackBySlug("dessau");

  it("is in the manifest with six pieces", () => {
    expect(dessau?.previews).toHaveLength(6);
  });

  it("every piece pairs a portrait phone render with a landscape desktop render", () => {
    for (const piece of dessau!.previews) {
      if (piece.kind !== "image") throw new Error("expected image pieces");
      expect(coverAspect(piece)).toBeLessThan(1);
      expect(piece.desktop).toBeDefined();
      expect(pieceAspect(piece)).toBeGreaterThan(1);
      expect(piece.desktop!.alt.length).toBeGreaterThan(0);
    }
  });

  it("every referenced file exists in public/", async () => {
    const { existsSync } = await import("node:fs");
    const urls = [dessau!.cover, ...dessau!.previews].flatMap((c) =>
      c.kind === "image" ? [c.url, ...(c.desktop ? [c.desktop.url] : [])] : [],
    );
    for (const url of urls) expect(existsSync(`public${url}`), url).toBe(true);
  });
});

describe("describeContents", () => {
  const img = { kind: "image", url: "/a.png", alt: "a" } as const;

  it("counts pieces, not files", () => {
    expect(describeContents({ previews: [img, img, img] })).toBe("3 wallpapers");
  });

  it("uses the singular for one piece", () => {
    expect(describeContents({ previews: [img] })).toBe("1 wallpaper");
  });

  it("says phone + desktop when pieces ship both renders", () => {
    const pair = { ...img, desktop: { url: "/b.png", alt: "b" } };
    expect(describeContents({ previews: [pair, pair] })).toBe("2 wallpapers · phone + desktop");
  });
});

describe("coverAspect / pieceAspect", () => {
  it("falls back to 3:4 when the size is unknown", () => {
    expect(coverAspect({ kind: "image", url: "/a.png", alt: "a" })).toBe(3 / 4);
  });

  it("reads the declared size", () => {
    expect(coverAspect({ kind: "image", url: "/a.jpg", alt: "a", width: 1600, height: 900 })).toBe(
      1600 / 900,
    );
  });
});

describe("getPackBySlug", () => {
  it("returns the matching pack for a known slug", () => {
    const all = getPacks();
    const first = all[0];
    expect(getPackBySlug(first.slug)).toEqual(first);
  });

  it("returns undefined for unknown slugs", () => {
    expect(getPackBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("filterPacks", () => {
  const all = getPacks();

  it("returns all packs when style is null", () => {
    expect(filterPacks(null)).toEqual(all);
  });

  it("returns all packs when style is undefined", () => {
    expect(filterPacks(undefined)).toEqual(all);
  });

  it("returns only packs of the requested style", () => {
    const filtered = filterPacks("gradient");
    expect(filtered.length).toBeGreaterThan(0);
    for (const p of filtered) expect(p.style).toBe("gradient");
  });

  it("returns an empty array for a style not present in the catalog", () => {
    // The launch catalog is gradient-only — assert the empty-result branch
    // works without depending on the absence of a specific style forever.
    const styles = availableStyles();
    const absent = (PACK_STYLES.find((s) => !styles.includes(s)) ?? null) as
      | (typeof PACK_STYLES)[number]
      | null;
    if (!absent) return; // defensive: skip if catalog covers every style
    expect(filterPacks(absent)).toEqual([]);
  });
});

describe("availableStyles", () => {
  it("returns the styles actually present in the catalog", () => {
    const got = availableStyles();
    const all = getPacks();
    const expected = new Set(all.map((p) => p.style));
    expect(new Set(got)).toEqual(expected);
  });
});

function assertCover(c: Pack["cover"]): void {
  if (c.kind === "gradient") {
    expect(c.colors.length).toBe(4);
    for (const hex of c.colors) expect(hex).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(["mesh", "liquid", "aurora"]).toContain(c.style);
    expect(c.blur).toBeGreaterThanOrEqual(0);
    expect(c.grain).toBeGreaterThanOrEqual(0);
    expect(c.grain).toBeLessThanOrEqual(100);
    expect(Number.isFinite(c.seed)).toBe(true);
  } else {
    expect(c.kind).toBe("image");
    expect(c.url.length).toBeGreaterThan(0);
    expect(c.alt.length).toBeGreaterThan(0);
  }
}
