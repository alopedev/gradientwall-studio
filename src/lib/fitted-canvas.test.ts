import { describe, expect, it } from "vitest";
import { fitCanvasSize, pixelKey } from "./fitted-canvas";

const MOBILE = { nativeW: 1440, nativeH: 3200 };
const DESKTOP = { nativeW: 5120, nativeH: 2880 };

describe("fitCanvasSize", () => {
  it("returns null while the box has no size", () => {
    expect(fitCanvasSize({ cssW: 0, cssH: 400, dpr: 1, ...MOBILE })).toBeNull();
    expect(fitCanvasSize({ cssW: 300, cssH: 0, dpr: 1, ...MOBILE })).toBeNull();
  });

  it("fits the box at the native aspect, height-bound for a phone frame", () => {
    // 300×400 box, aspect 0.45: width = min(300, 400*0.45) = 180.
    expect(fitCanvasSize({ cssW: 300, cssH: 400, dpr: 1, ...MOBILE })).toEqual({ w: 180, h: 400 });
  });

  it("fits width-bound for a wide frame", () => {
    // 1600×1600 box, aspect 16:9: width = min(1600, 1600*1.78) = 1600 → h 900.
    expect(fitCanvasSize({ cssW: 1600, cssH: 1600, dpr: 1, ...DESKTOP })).toEqual({
      w: 1600,
      h: 900,
    });
  });

  it("multiplies by DPR but caps it at maxDpr (default 2)", () => {
    const at2 = fitCanvasSize({ cssW: 300, cssH: 400, dpr: 2, ...MOBILE });
    expect(at2).toEqual({ w: 360, h: 800 });
    expect(fitCanvasSize({ cssW: 300, cssH: 400, dpr: 3, ...MOBILE })).toEqual(at2);
    expect(fitCanvasSize({ cssW: 300, cssH: 400, dpr: 3, maxDpr: 3, ...MOBILE })).toEqual({
      w: 540,
      h: 1200,
    });
  });

  it("treats a missing / zero dpr as 1", () => {
    expect(fitCanvasSize({ cssW: 300, cssH: 400, dpr: 0, ...MOBILE })).toEqual({ w: 180, h: 400 });
  });

  it("caps the longest side at maxDim (default 2400) keeping the aspect", () => {
    const s = fitCanvasSize({ cssW: 4000, cssH: 4000, dpr: 2, ...DESKTOP });
    expect(s?.w).toBe(2400);
    expect(s?.h).toBe(1350);
    const tall = fitCanvasSize({ cssW: 3000, cssH: 3000, dpr: 2, ...MOBILE });
    expect(tall?.h).toBe(2400);
    expect(tall?.w).toBe(1080);
  });

  it("never exceeds the native size", () => {
    const s = fitCanvasSize({ cssW: 9000, cssH: 9000, dpr: 2, maxDim: 10000, ...MOBILE });
    expect(s).toEqual({ w: 1440, h: 3200 });
  });
});

describe("pixelKey", () => {
  const base = {
    style: "liquid" as const,
    colors: ["#111111", "#222222", "#333333", "#444444"],
    blur: 48,
    seed: 1234,
    lightAngle: 315,
    density: 0.5,
    grain: 45,
  };

  it("is stable for equal params", () => {
    expect(pixelKey({ ...base }, "v1")).toBe(pixelKey({ ...base }, "v1"));
    expect(pixelKey({ ...base }, "v2")).toBe(pixelKey({ ...base }, "v2"));
  });

  it.each([
    ["style", { style: "aurora" as const }],
    ["colors", { colors: ["#111111", "#222222", "#333333", "#555555"] }],
    ["seed", { seed: 99 }],
    ["lightAngle", { lightAngle: 10 }],
    ["grain", { grain: 10 }],
  ])("both pipelines repaint when %s changes", (_name, patch) => {
    expect(pixelKey({ ...base, ...patch }, "v1")).not.toBe(pixelKey(base, "v1"));
    expect(pixelKey({ ...base, ...patch }, "v2")).not.toBe(pixelKey(base, "v2"));
  });

  it("v1 repaints on softness and density", () => {
    expect(pixelKey({ ...base, blur: 80 }, "v1")).not.toBe(pixelKey(base, "v1"));
    expect(pixelKey({ ...base, density: 0.8 }, "v1")).not.toBe(pixelKey(base, "v1"));
  });

  it("v2 ignores softness and density: the shader has neither", () => {
    expect(pixelKey({ ...base, blur: 80, density: 0.8 }, "v2")).toBe(pixelKey(base, "v2"));
  });

  it("v2 repaints on a new material; v1 ignores it (it has none)", () => {
    expect(pixelKey({ ...base, material: "fluted" }, "v2")).not.toBe(pixelKey(base, "v2"));
    expect(pixelKey({ ...base, material: "none" }, "v2")).toBe(pixelKey(base, "v2"));
    expect(pixelKey({ ...base, material: "fluted" }, "v1")).toBe(pixelKey(base, "v1"));
  });

  it("distinguishes a ramp of 3 colours from a ramp of 4", () => {
    expect(pixelKey({ ...base, colors: base.colors.slice(0, 3) }, "v2")).not.toBe(
      pixelKey(base, "v2"),
    );
  });
});
