import { describe, expect, it } from "vitest";
import { decodeLookParam, encodeLookParam } from "../look-url";
import { ENGINE_PACKS, ENGINE_PACK_SIZES, enginePackFile, getEnginePack } from "./engine-packs";

describe("engine packs", () => {
  it("Marble has 12 pieces with unique names", () => {
    const marble = getEnginePack("marble");
    expect(marble?.pieces).toHaveLength(12);
    const names = marble!.pieces.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every piece is a valid look that survives a link round trip", () => {
    for (const pack of Object.values(ENGINE_PACKS)) {
      for (const { name: _name, ...look } of pack.pieces) {
        expect(decodeLookParam(encodeLookParam(look))).toEqual(look);
      }
    }
  });

  it("every piece goes from dark to light, so the engine's ramp reads as intended", () => {
    const luma = (hex: string) => {
      const n = Number.parseInt(hex.slice(1), 16);
      return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
    };
    for (const pack of Object.values(ENGINE_PACKS)) {
      for (const piece of pack.pieces) {
        expect(luma(piece.colors[0])).toBeLessThan(luma(piece.colors[3]));
      }
    }
  });

  it("ships the Etsy sizes: phone 1320×2868, desktop 4K and 5K", () => {
    expect(ENGINE_PACK_SIZES).toEqual({
      mobile: { w: 1320, h: 2868 },
      "4k": { w: 3840, h: 2160 },
      "5k": { w: 5120, h: 2880 },
    });
  });

  it("names files the way the Etsy listing renderer reads them", () => {
    expect(enginePackFile("marble", 0, "4k")).toBe("4k/gradientwall-marble-01-4k.jpg");
    expect(enginePackFile("marble", 11, "mobile")).toBe("mobile/gradientwall-marble-12-mobile.jpg");
  });

  it("returns undefined for an unknown pack", () => {
    expect(getEnginePack("nope")).toBeUndefined();
  });
});
