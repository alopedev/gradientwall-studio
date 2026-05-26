import { describe, expect, it } from "vitest";
import { CURATED_SEEDS } from "./curated-seeds";
import {
  CURATED_CONTRAST,
  CURATED_GRAIN,
  CURATED_VIBRANCE,
  SURPRISE_BLUR_MAX,
  SURPRISE_BLUR_MIN,
  SURPRISE_DENSITY_MAX,
  SURPRISE_DENSITY_MIN,
  SURPRISE_LIGHT_MAX,
  SURPRISE_LIGHT_MIN,
  generateSurprise,
  generateSurpriseFromSeed,
} from "./surprise";

describe("generateSurprise", () => {
  it("returns a complete GradientConfig with all required fields", () => {
    const cfg = generateSurprise();
    expect(cfg.colors).toHaveLength(4);
    expect(cfg.style).toBe("liquid");
    expect(CURATED_SEEDS).toContain(cfg.seed);
    expect(cfg.lightAngle).toBeGreaterThanOrEqual(SURPRISE_LIGHT_MIN);
    expect(cfg.lightAngle).toBeLessThanOrEqual(SURPRISE_LIGHT_MAX);
    expect(cfg.density).toBeGreaterThanOrEqual(SURPRISE_DENSITY_MIN);
    expect(cfg.density).toBeLessThanOrEqual(SURPRISE_DENSITY_MAX);
    expect(cfg.blur).toBeGreaterThanOrEqual(SURPRISE_BLUR_MIN);
    expect(cfg.blur).toBeLessThanOrEqual(SURPRISE_BLUR_MAX);
  });

  it("freezes grain / contrast / vibrance at curated defaults", () => {
    for (let i = 0; i < 30; i++) {
      const cfg = generateSurprise();
      expect(cfg.grain).toBe(CURATED_GRAIN);
      expect(cfg.contrast).toBe(CURATED_CONTRAST);
      expect(cfg.vibrance).toBe(CURATED_VIBRANCE);
    }
  });

  it("never returns the previous seed", () => {
    for (let i = 0; i < 100; i++) {
      const prev = CURATED_SEEDS[i % CURATED_SEEDS.length];
      const cfg = generateSurprise(prev);
      expect(cfg.seed).not.toBe(prev);
    }
  });

  it("always picks a seed from CURATED_SEEDS", () => {
    for (let i = 0; i < 50; i++) {
      const cfg = generateSurprise();
      expect(CURATED_SEEDS).toContain(cfg.seed);
    }
  });

  it("is deterministic given an injected rng", () => {
    const fixed = () => 0.5;
    const a = generateSurprise(undefined, fixed);
    const b = generateSurprise(undefined, fixed);
    expect(a).toEqual(b);
  });
});

describe("generateSurpriseFromSeed", () => {
  it("produces the same output for the same master seed", () => {
    const a = generateSurpriseFromSeed(42);
    const b = generateSurpriseFromSeed(42);
    expect(a).toEqual(b);
  });

  it("produces different output for different master seeds", () => {
    const a = generateSurpriseFromSeed(1);
    const b = generateSurpriseFromSeed(2);
    // Cualquier campo basta para diferenciar; el seed concreto debe ser
    // distinto o si coincide, otros campos también.
    expect(a).not.toEqual(b);
  });
});
