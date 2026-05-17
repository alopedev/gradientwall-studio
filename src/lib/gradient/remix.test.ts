import { describe, expect, it } from "vitest";
import type { Colors4, GradientConfig } from "../palettes";
import { CURATED_SEEDS } from "./curated-seeds";
import { generateRemix } from "./remix";
import {
  CURATED_CONTRAST,
  CURATED_GRAIN,
  CURATED_VIBRANCE,
  SURPRISE_DENSITY_MAX,
  SURPRISE_DENSITY_MIN,
  SURPRISE_LIGHT_MAX,
  SURPRISE_LIGHT_MIN,
} from "./surprise";

const baseConfig = (overrides: Partial<GradientConfig> = {}): GradientConfig => ({
  colors: ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"] as Colors4,
  style: "mesh",
  blur: 48,
  grain: 32,
  seed: CURATED_SEEDS[0],
  lightAngle: 135,
  density: 0.5,
  contrast: 1,
  vibrance: 1.05,
  ...overrides,
});

describe("generateRemix", () => {
  it("preserves the palette exactly", () => {
    const current = baseConfig();
    for (let i = 0; i < 30; i++) {
      const remix = generateRemix(current);
      expect(remix.colors).toEqual(current.colors);
    }
  });

  it("preserves the style", () => {
    for (const style of ["mesh", "liquid", "aurora", "nebula"] as const) {
      const current = baseConfig({ style });
      const remix = generateRemix(current);
      expect(remix.style).toBe(style);
    }
  });

  it("never returns the same seed", () => {
    for (let i = 0; i < 50; i++) {
      const current = baseConfig({ seed: CURATED_SEEDS[i % CURATED_SEEDS.length] });
      const remix = generateRemix(current);
      expect(remix.seed).not.toBe(current.seed);
      expect(CURATED_SEEDS).toContain(remix.seed);
    }
  });

  it("keeps lightAngle within the operative range after jitter", () => {
    for (let i = 0; i < 100; i++) {
      const current = baseConfig({ lightAngle: SURPRISE_LIGHT_MIN });
      const remix = generateRemix(current);
      expect(remix.lightAngle).toBeGreaterThanOrEqual(SURPRISE_LIGHT_MIN);
      expect(remix.lightAngle).toBeLessThanOrEqual(SURPRISE_LIGHT_MAX);
    }
  });

  it("keeps density within the operative range after jitter", () => {
    for (let i = 0; i < 100; i++) {
      const current = baseConfig({ density: SURPRISE_DENSITY_MIN });
      const remix = generateRemix(current);
      expect(remix.density).toBeGreaterThanOrEqual(SURPRISE_DENSITY_MIN);
      expect(remix.density).toBeLessThanOrEqual(SURPRISE_DENSITY_MAX);
    }
  });

  it("keeps blur within the renderer-safe range [0, 200]", () => {
    for (let i = 0; i < 100; i++) {
      const current = baseConfig({ blur: 200 });
      const remix = generateRemix(current);
      expect(remix.blur).toBeGreaterThanOrEqual(0);
      expect(remix.blur).toBeLessThanOrEqual(200);
    }
  });

  it("freezes grain / contrast / vibrance at curated defaults", () => {
    const current = baseConfig({ grain: 99, contrast: 0.5, vibrance: 1.4 });
    const remix = generateRemix(current);
    expect(remix.grain).toBe(CURATED_GRAIN);
    expect(remix.contrast).toBe(CURATED_CONTRAST);
    expect(remix.vibrance).toBe(CURATED_VIBRANCE);
  });

  it("is deterministic given an injected rng", () => {
    const current = baseConfig();
    const fixed = () => 0.5;
    expect(generateRemix(current, fixed)).toEqual(generateRemix(current, fixed));
  });

  it("handles configs without lightAngle / density (legacy history items)", () => {
    const current = baseConfig({ lightAngle: undefined, density: undefined });
    // No debe lanzar; usa los defaults documentados (135 / 0.5).
    expect(() => generateRemix(current)).not.toThrow();
    const remix = generateRemix(current);
    expect(remix.lightAngle).toBeGreaterThanOrEqual(SURPRISE_LIGHT_MIN);
    expect(remix.density).toBeGreaterThanOrEqual(SURPRISE_DENSITY_MIN);
  });
});
