import { describe, it, expect } from "vitest";
import { getPacks, getPackBySlug, filterPacks, availableStyles, PACK_STYLES } from "./index";
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
      // The PRD targets 10 wallpapers per pack at launch.
      expect(p.previews.length).toBe(10);
      expect(p.cover).toBeDefined();
      assertCover(p.cover);
      for (const preview of p.previews) assertCover(preview);
    }
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
    expect(["mesh", "blobs", "liquid", "aurora"]).toContain(c.style);
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
