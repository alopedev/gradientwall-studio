import { describe, expect, it } from "vitest";
import { curatedPaletteIndex, paletteName } from "./palette-name";
import { PALETTES } from "./palettes";

describe("paletteName", () => {
  it("returns the curated name when the colors match a palette (case-insensitive)", () => {
    expect(paletteName(PALETTES[1].colors)).toBe("Tokyo");
    expect(paletteName(PALETTES[1].colors.map((c) => c.toUpperCase()))).toBe("Tokyo");
  });

  it("names a custom palette after its most vivid color", () => {
    expect(paletteName(["#101010", "#202020", "#1fb5a8", "#f0f0f0"])).toBe("Lagoon");
    expect(paletteName(["#101010", "#202020", "#e11d48", "#f0f0f0"])).toBe("Rose");
  });

  it("falls back to Graphite for desaturated palettes", () => {
    expect(paletteName(["#101010", "#404040", "#808080", "#d0d0d0"])).toBe("Graphite");
  });

  it("is deterministic", () => {
    const colors = ["#12355b", "#420039", "#d72638", "#ffffff"];
    expect(paletteName(colors)).toBe(paletteName(colors));
  });
});

describe("curatedPaletteIndex", () => {
  it("finds a curated palette and returns -1 otherwise", () => {
    expect(curatedPaletteIndex(PALETTES[3].colors)).toBe(3);
    expect(curatedPaletteIndex(["#000000", "#111111", "#222222", "#333333"])).toBe(-1);
  });
});
