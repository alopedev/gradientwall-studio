import { describe, expect, it } from "vitest";
import { STYLES } from "../palettes";
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
  pickWeightedStyle,
} from "./surprise";

describe("pickWeightedStyle", () => {
  it("returns one of the four canonical styles", () => {
    for (let i = 0; i < 50; i++) {
      expect(STYLES).toContain(pickWeightedStyle());
    }
  });

  it("picks liquid for low rng (0..0.35)", () => {
    expect(pickWeightedStyle(() => 0)).toBe("liquid");
    expect(pickWeightedStyle(() => 0.34)).toBe("liquid");
  });

  it("picks mesh for the next band (0.35..0.65)", () => {
    expect(pickWeightedStyle(() => 0.5)).toBe("mesh");
  });

  it("picks aurora for the next band (0.65..0.9)", () => {
    expect(pickWeightedStyle(() => 0.8)).toBe("aurora");
  });

  it("picks nebula for the top band", () => {
    expect(pickWeightedStyle(() => 0.95)).toBe("nebula");
  });

  it("approximates the documented weights over a large sample", () => {
    const counts: Record<string, number> = { liquid: 0, mesh: 0, aurora: 0, nebula: 0 };
    const N = 10000;
    for (let i = 0; i < N; i++) counts[pickWeightedStyle()]++;
    // Tolerancia ±3% (sampling noise).
    expect(counts.liquid / N).toBeGreaterThan(0.32);
    expect(counts.liquid / N).toBeLessThan(0.38);
    expect(counts.nebula / N).toBeGreaterThan(0.07);
    expect(counts.nebula / N).toBeLessThan(0.13);
  });
});

describe("generateSurprise", () => {
  it("returns a complete GradientConfig with all required fields", () => {
    const cfg = generateSurprise();
    expect(cfg.colors).toHaveLength(4);
    expect(STYLES).toContain(cfg.style);
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
