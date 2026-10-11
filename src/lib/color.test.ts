import { describe, expect, it } from "vitest";
import { clamp, hexToHsl, hexToRgb, hslToHex, lerp, parseHex, rgbToHex, wrapAngle } from "./color";

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
