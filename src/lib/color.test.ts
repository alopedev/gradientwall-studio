import { describe, expect, it } from "vitest";
import {
  clamp,
  contrastRatio,
  hexToHsl,
  hexToRgb,
  hslToHex,
  lerp,
  parseHex,
  relativeLuminance,
  rgbToHex,
  wrapAngle,
} from "./color";

describe("parseHex", () => {
  it("reads 6- and 3-digit hex, with or without #, any case", () => {
    expect(parseHex("#ff8000")).toEqual([255, 128, 0]);
    expect(parseHex("FF8000")).toEqual([255, 128, 0]);
    expect(parseHex("#f80")).toEqual([255, 136, 0]);
    expect(parseHex("  #0a0b0c ")).toEqual([10, 11, 12]);
  });

  it("returns null for anything else", () => {
    for (const bad of ["", "#", "#12", "#12345", "#1234567", "#ggg", "red"]) {
      expect(parseHex(bad)).toBeNull();
    }
  });
});

describe("hexToRgb / rgbToHex", () => {
  it("falls back to black on invalid input", () => {
    expect(hexToRgb("nope")).toEqual([0, 0, 0]);
  });

  it("round-trips and clamps", () => {
    expect(rgbToHex(hexToRgb("#1fb5a8"))).toBe("#1fb5a8");
    expect(rgbToHex([-10, 300, 127.6])).toBe("#00ff80");
  });
});

describe("hslToHex / hexToHsl", () => {
  it("converts the primaries", () => {
    expect(hslToHex(0, 100, 50)).toBe("#ff0000");
    expect(hslToHex(120, 100, 50)).toBe("#00ff00");
    expect(hslToHex(240, 100, 50)).toBe("#0000ff");
    expect(hexToHsl("#ff0000")).toEqual([0, 100, 50]);
    expect(hexToHsl("#0000ff")).toEqual([240, 100, 50]);
  });

  it("returns [0,0,0] for invalid input and 0 saturation for greys", () => {
    expect(hexToHsl("nope")).toEqual([0, 0, 0]);
    expect(hexToHsl("#808080")).toEqual([0, 0, 50]);
  });
});

describe("number helpers", () => {
  it("clamp / lerp / wrapAngle", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(wrapAngle(-30)).toBe(330);
    expect(wrapAngle(725)).toBe(5);
    expect(wrapAngle(360)).toBe(0);
  });
});

describe("relativeLuminance / contrastRatio (WCAG 2)", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
  });

  it("gives 21:1 for black on white, symmetric, and 1:1 for equal colours", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777", "#777")).toBe(1);
  });

  it("matches a known WCAG pair (#767676 on white is the 4.5:1 threshold)", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
});
