import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Pack } from "../packs";

const isCheckoutConfigured = vi.fn<() => boolean>();
vi.mock("./checkout", () => ({
  isCheckoutConfigured: () => isCheckoutConfigured(),
}));

const { canPurchasePack } = await import("./purchase");

const basePack: Pack = {
  slug: "test-pack",
  name: "Test",
  style: "gradient",
  description: "",
  tagline: "",
  cover: { kind: "gradient", colors: ["#000", "#111", "#222", "#333"], style: "mesh", blur: 50, grain: 30, seed: 1 },
  previews: [],
  priceEur: 4.99,
};

describe("canPurchasePack", () => {
  beforeEach(() => {
    isCheckoutConfigured.mockReset();
  });

  it("returns 'buyable' with the variantId when checkout is configured AND pack has a variant", () => {
    isCheckoutConfigured.mockReturnValue(true);
    const out = canPurchasePack({ ...basePack, lemonSqueezyVariantId: "var_123" });
    expect(out).toEqual({ kind: "buyable", variantId: "var_123" });
    if (out.kind === "buyable") {
      // Type-narrowing check: variantId is `string`, not `string | undefined`.
      const _: string = out.variantId;
      void _;
    }
  });

  it("returns 'missing-variant' when checkout is configured but pack has no variant", () => {
    isCheckoutConfigured.mockReturnValue(true);
    expect(canPurchasePack({ ...basePack, lemonSqueezyVariantId: undefined })).toEqual({
      kind: "missing-variant",
    });
  });

  it("returns 'checkout-not-configured' when checkout env is missing (independent of variant)", () => {
    isCheckoutConfigured.mockReturnValue(false);
    expect(canPurchasePack({ ...basePack, lemonSqueezyVariantId: "var_123" })).toEqual({
      kind: "checkout-not-configured",
    });
    expect(canPurchasePack({ ...basePack, lemonSqueezyVariantId: undefined })).toEqual({
      kind: "checkout-not-configured",
    });
  });
});
