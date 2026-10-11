// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { canvas2DEngine } from "@/components/studio/engine/canvas2d-engine";
import { webglEngine } from "@/components/studio/engine/webgl-engine";
import { generateRemix } from "@/lib/gradient/remix";
import { generateSurprise } from "@/lib/gradient/surprise";
import { useConfigStore } from "@/store/useConfigStore";
import {
  DEFAULT_CONTRAST,
  DEFAULT_DENSITY,
  DEFAULT_LIGHT_ANGLE,
  DEFAULT_VIBRANCE,
  STUDIO_BLUR,
  STUDIO_VIBRANCE,
  V1_DEFAULT_GRAIN,
  V2_DEFAULT_GRAIN,
  V2_DEFAULT_LIGHT_ANGLE,
} from "./defaults";

const defaultOf = (engine: typeof webglEngine, key: string) =>
  engine.adjustments.find((a) => a.key === key)?.default;

describe("render defaults", () => {
  it("the Studio starts at the v2 engine's Reset values", () => {
    const s = useConfigStore.getState();
    expect(s.engine).toBe("v2");
    expect(s.grain).toBe(defaultOf(webglEngine, "grain"));
    expect(s.lightAngle).toBe(defaultOf(webglEngine, "lightAngle"));
    expect(s.grain).toBe(V2_DEFAULT_GRAIN);
    expect(s.lightAngle).toBe(V2_DEFAULT_LIGHT_ANGLE);
  });

  it("the Studio starts with the shared density, grading and blur", () => {
    const s = useConfigStore.getState();
    expect(s.blur).toBe(STUDIO_BLUR);
    expect(s.density).toBe(DEFAULT_DENSITY);
    expect(s.contrast).toBe(DEFAULT_CONTRAST);
    expect(s.vibrance).toBe(STUDIO_VIBRANCE);
  });

  it("the Canvas2D engine resets to its documented values", () => {
    expect(defaultOf(canvas2DEngine, "blur")).toBe(STUDIO_BLUR);
    expect(defaultOf(canvas2DEngine, "grain")).toBe(V1_DEFAULT_GRAIN);
    expect(defaultOf(canvas2DEngine, "lightAngle")).toBe(DEFAULT_LIGHT_ANGLE);
    expect(defaultOf(canvas2DEngine, "contrast")).toBe(DEFAULT_CONTRAST);
    expect(defaultOf(canvas2DEngine, "vibrance")).toBe(STUDIO_VIBRANCE);
  });

  it("fallbacks for absent fields stay frozen (old favorites render as saved)", () => {
    expect(DEFAULT_LIGHT_ANGLE).toBe(135);
    expect(DEFAULT_DENSITY).toBe(0.5);
    expect(DEFAULT_CONTRAST).toBe(1);
    expect(DEFAULT_VIBRANCE).toBe(1);
  });

  it("a surprise finishes with the Studio's starting look", () => {
    const cfg = generateSurprise();
    expect(cfg.grain).toBe(V2_DEFAULT_GRAIN);
    expect(cfg.contrast).toBe(DEFAULT_CONTRAST);
    expect(cfg.vibrance).toBe(STUDIO_VIBRANCE);
  });

  it("a remix of the starting look keeps it", () => {
    const s = useConfigStore.getState();
    const remix = generateRemix({
      colors: s.colors,
      style: s.style,
      blur: s.blur,
      grain: s.grain,
      seed: s.seed,
      lightAngle: s.lightAngle,
      density: s.density,
      contrast: s.contrast,
      vibrance: s.vibrance,
    });
    expect(remix.grain).toBe(V2_DEFAULT_GRAIN);
    expect(remix.vibrance).toBe(STUDIO_VIBRANCE);
  });
});
