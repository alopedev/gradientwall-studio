// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MATERIALS } from "../palettes";
import { MATERIAL_FRAG, TONE_FRAG } from "./material";

describe("material shaders", () => {
  it("has one shader for every material but none", () => {
    expect(Object.keys(MATERIAL_FRAG).sort()).toEqual(MATERIALS.filter((m) => m !== "none").sort());
  });

  it.each(
    Object.entries(MATERIAL_FRAG),
  )("%s reads the wallpaper texture in GLSL ES 3.00", (_m, src) => {
    expect(src.startsWith("#version 300 es\n")).toBe(true);
    expect(src).toContain("uniform sampler2D uBase;");
    expect(src).toContain("void main()");
  });

  it.each(
    Object.entries({ ...MATERIAL_FRAG, tone: TONE_FRAG }),
  )("%s ends through the tone curve, which is a no-op at uTone = 1", (_m, src) => {
    expect(src).toContain("uniform float uTone;");
    expect(src).toContain("uTone == 1.0 ? c :");
    expect(src).toMatch(/outColor = vec4\(tone\(/);
  });
});
