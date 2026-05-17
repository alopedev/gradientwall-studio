import { describe, it, expect, vi } from "vitest";
import type { Pack } from "../packs";

const mockPacks = vi.hoisted(() => ({ packs: [] as Pack[] }));
vi.mock("../packs", async () => {
  const actual = await vi.importActual<typeof import("../packs")>("../packs");
  return {
    ...actual,
    getPacks: () => mockPacks.packs,
  };
});

const { validateCatalog } = await import("./catalog");

const base: Pack = {
  slug: "x",
  name: "X",
  style: "gradient",
  description: "",
  tagline: "",
  cover: {
    kind: "gradient",
    colors: ["#000", "#111", "#222", "#333"],
    style: "mesh",
    blur: 50,
    grain: 30,
    seed: 1,
  },
  previews: [
    {
      kind: "gradient",
      colors: ["#000", "#111", "#222", "#333"],
      style: "mesh",
      blur: 50,
      grain: 30,
      seed: 1,
    },
  ],
  priceEur: 4.99,
  lemonSqueezyVariantId: "var_1",
};

describe("validateCatalog", () => {
  it("returns no issues for a clean catalog", () => {
    mockPacks.packs = [{ ...base }];
    expect(validateCatalog()).toEqual([]);
  });

  it("flags packs without a lemonSqueezyVariantId", () => {
    mockPacks.packs = [{ ...base, slug: "novariant", lemonSqueezyVariantId: undefined }];
    expect(validateCatalog()).toEqual([{ kind: "missing-variant", slug: "novariant" }]);
  });

  it("flags duplicate slugs", () => {
    mockPacks.packs = [
      { ...base, slug: "dupe" },
      { ...base, slug: "dupe" },
    ];
    expect(validateCatalog()).toContainEqual({ kind: "duplicate-slug", slug: "dupe" });
  });

  it("flags packs with empty previews", () => {
    mockPacks.packs = [{ ...base, slug: "nopreviews", previews: [] }];
    expect(validateCatalog()).toContainEqual({ kind: "empty-previews", slug: "nopreviews" });
  });

  it("flags non-finite or non-positive prices", () => {
    mockPacks.packs = [
      { ...base, slug: "zero", priceEur: 0 },
      { ...base, slug: "nan", priceEur: NaN },
    ];
    const issues = validateCatalog();
    expect(issues).toContainEqual({ kind: "invalid-price", slug: "zero", priceEur: 0 });
    expect(issues).toContainEqual({ kind: "invalid-price", slug: "nan", priceEur: NaN });
  });
});

// Regression check against the actual catalog manifest. Five packs currently
// ship without a Lemon Squeezy variant (pre-checkout phase) — that's the only
// expected issue. If this number changes, update the assertion.
describe("validateCatalog against the live packs.json", () => {
  it("matches the expected pre-launch state", async () => {
    vi.doUnmock("../packs");
    vi.resetModules();
    const { validateCatalog: live } = await import("./catalog");
    const issues = live();
    const variantIssues = issues.filter((i) => i.kind === "missing-variant");
    expect(variantIssues.length).toBeGreaterThan(0);
    // No structural issues should exist.
    const structural = issues.filter((i) => i.kind !== "missing-variant");
    expect(structural).toEqual([]);
  });
});
