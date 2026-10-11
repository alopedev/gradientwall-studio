// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildCatalog, getCatalog } from "./catalog";

describe("buildCatalog", () => {
  const entries = [
    { slug: "a", name: "Pack A", lemonSqueezyVariantId: "11" },
    { slug: "b", name: "Pack B", lemonSqueezyVariantId: 22 },
    { slug: "c", name: "Pack C", lemonSqueezyVariantId: null },
  ];

  it("maps a variant to its pack, whether the ID is a string or a number", () => {
    const catalog = buildCatalog(entries);
    expect(catalog.byVariant("11")).toEqual({ slug: "a", name: "Pack A", variantId: "11" });
    expect(catalog.byVariant(22)).toEqual({ slug: "b", name: "Pack B", variantId: "22" });
  });

  it("returns null for unknown or missing variants", () => {
    const catalog = buildCatalog(entries);
    expect(catalog.byVariant("999")).toBeNull();
    expect(catalog.byVariant(null)).toBeNull();
    expect(catalog.byVariant(undefined)).toBeNull();
  });

  it("leaves out packs that aren't on sale yet (no variant)", () => {
    const catalog = buildCatalog(entries);
    expect(catalog.bySlug("c")).toBeNull();
    expect(catalog.bySlug("a")).toMatchObject({ name: "Pack A" });
    expect(catalog.bySlug("nope")).toBeNull();
  });

  it("skips malformed entries and non-array input", () => {
    expect(buildCatalog(null).byVariant("1")).toBeNull();
    const catalog = buildCatalog([
      null,
      "x",
      { slug: "z" },
      { name: "n", lemonSqueezyVariantId: "5" },
    ]);
    expect(catalog.byVariant("5")).toBeNull();
  });

  it("throws on a duplicate slug or variant instead of picking one", () => {
    expect(() =>
      buildCatalog([
        { slug: "a", name: "A", lemonSqueezyVariantId: "1" },
        { slug: "a", name: "A2", lemonSqueezyVariantId: "2" },
      ]),
    ).toThrow(/duplicate slug/);
    expect(() =>
      buildCatalog([
        { slug: "a", name: "A", lemonSqueezyVariantId: "1" },
        { slug: "b", name: "B", lemonSqueezyVariantId: "1" },
      ]),
    ).toThrow(/duplicate .*variant/);
  });
});

describe("getCatalog (bundled manifest)", () => {
  it("loads the real manifest without throwing", () => {
    expect(() => getCatalog()).not.toThrow();
  });
});
