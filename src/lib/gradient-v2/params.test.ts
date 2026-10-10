// @vitest-environment node
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  compassToRadians,
  hexToRgb01,
  rampToFour,
  resolveV2Uniforms,
  toV2Style,
  V2_STYLE_DEFAULTS,
} from "./params";
import { FRAG, VERT } from "./shader";

const RAMP = ["#0a0a10", "#3b1a63", "#e2553a", "#f7c890"] as const;

describe("hexToRgb01", () => {
  it("parses 6- and 3-digit hex into 0..1 sRGB", () => {
    expect(hexToRgb01("#ff8000")).toEqual([1, 128 / 255, 0]);
    expect(hexToRgb01("fff")).toEqual([1, 1, 1]);
  });
  it("rejects malformed input instead of feeding NaN to the shader", () => {
    expect(() => hexToRgb01("#12")).toThrow();
    expect(() => hexToRgb01("#zzzzzz")).toThrow();
  });
});

describe("rampToFour", () => {
  it("keeps a 4-colour ramp as is", () => {
    expect(rampToFour(RAMP)).toEqual([...RAMP]);
  });
  it("stretches 2 and 3 colours while keeping dark → light order", () => {
    expect(rampToFour(["#000000", "#ffffff"])).toEqual([
      "#000000",
      "#000000",
      "#ffffff",
      "#ffffff",
    ]);
    expect(rampToFour(["#000000", "#808080", "#ffffff"])).toEqual([
      "#000000",
      "#808080",
      "#808080",
      "#ffffff",
    ]);
  });
  it("throws on an empty ramp", () => {
    expect(() => rampToFour([])).toThrow();
  });
});

describe("compassToRadians", () => {
  it("maps compass (0 = top, clockwise) to math radians with y up", () => {
    const dir = (deg: number) => {
      const a = compassToRadians(deg);
      return [Math.round(Math.cos(a) * 1e6) / 1e6 + 0, Math.round(Math.sin(a) * 1e6) / 1e6 + 0];
    };
    expect(dir(0)).toEqual([0, 1]); // up
    expect(dir(90)).toEqual([1, 0]); // right
    expect(dir(180)).toEqual([0, -1]); // down
    expect(dir(270)).toEqual([-1, 0]); // left
  });
});

describe("toV2Style", () => {
  it("maps v1 style names onto the three v2 looks", () => {
    expect(toV2Style("liquid")).toBe("liquid");
    expect(toV2Style("aurora")).toBe("aurora");
    expect(toV2Style("mesh")).toBe("grain-mesh");
    expect(toV2Style("nebula")).toBe("liquid");
    expect(toV2Style("grain-mesh")).toBe("grain-mesh");
  });
});

describe("resolveV2Uniforms", () => {
  it("uses the style's calibrated defaults when grain and light angle are omitted", () => {
    const u = resolveV2Uniforms({ colors: RAMP, style: "liquid", seed: 7 });
    expect(u.grain).toBe(V2_STYLE_DEFAULTS.liquid.grain);
    expect(u.warp).toBe(V2_STYLE_DEFAULTS.liquid.warp);
    // Prototype default: math 135° (top-left).
    expect(u.lightAngleRad).toBeCloseTo((135 * Math.PI) / 180);
    expect(u.dither).toBe(1);
    expect(u.colors).toHaveLength(12);
  });

  it("maps the Studio grain slider 0..100 to 0..1, clamped", () => {
    const g = (grain: number) =>
      resolveV2Uniforms({ colors: RAMP, style: "aurora", seed: 1, grain }).grain;
    expect(g(0)).toBe(0);
    expect(g(50)).toBe(0.5);
    expect(g(140)).toBe(1);
    expect(g(-5)).toBe(0);
  });

  it("passes seeds as unsigned 32-bit and honours dither: false", () => {
    const u = resolveV2Uniforms({ colors: RAMP, style: "mesh", seed: -1, dither: false });
    expect(u.seed).toBe(0xffffffff);
    expect(u.dither).toBe(0);
    expect(u.style).toBe(2);
  });

  it("is stable for a fixed input (regression guard)", () => {
    expect(
      resolveV2Uniforms({ colors: RAMP, style: "liquid", seed: 4821, lightAngle: 135, grain: 45 }),
    ).toMatchSnapshot();
  });
});

describe("shader sources", () => {
  it("declares every uniform the renderer sets", () => {
    for (const n of [
      "uRes",
      "uSeed",
      "uCol",
      "uWarp",
      "uScale",
      "uGrain",
      "uLight",
      "uLightAngle",
      "uStyle",
      "uDither",
    ]) {
      expect(FRAG).toContain(`uniform`);
      expect(FRAG).toMatch(new RegExp(`\\b${n}\\b`));
    }
    expect(VERT).toContain("aPos");
  });

  // The shader is signed-off visual math (see shader.ts). Changing it must be
  // a deliberate act: update this snapshot only with a visual review.
  it("matches the approved prototype source", () => {
    const sha = createHash("sha256").update(VERT).update(FRAG).digest("hex");
    expect(sha).toMatchSnapshot();
  });
});
