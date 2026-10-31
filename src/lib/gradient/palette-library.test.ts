import { describe, expect, it } from "vitest";
import { hexToOklch } from "../color";
import { PALETTES } from "../palettes";
import { hueDistance } from "./palette-constraints";
import {
  DESIGNER_HUE_SHIFT,
  DESIGNER_LIGHT_SCALE,
  MIN_LIGHT_SPREAD,
  PALETTE_LIBRARY,
  SHUFFLE_PALETTES,
  designerColors,
  lightSpread,
} from "./palette-library";
import { mulberry32 } from "./spec";

const HEX = /^#[0-9a-f]{6}$/;
const key = (c: readonly string[]) => c.join(",").toLowerCase();

describe("PALETTE_LIBRARY", () => {
  it("holds a large set of distinct 4-colour palettes in lowercase hex", () => {
    expect(PALETTE_LIBRARY.length).toBeGreaterThanOrEqual(150);
    for (const p of PALETTE_LIBRARY) {
      expect(p).toHaveLength(4);
      for (const c of p) expect(c).toMatch(HEX);
    }
    expect(new Set(PALETTE_LIBRARY.map(key)).size).toBe(PALETTE_LIBRARY.length);
  });

  it("includes the 10 curated Studio palettes", () => {
    const all = new Set(PALETTE_LIBRARY.map(key));
    for (const p of PALETTES) expect(all.has(key(p.colors))).toBe(true);
  });
});

describe("SHUFFLE_PALETTES", () => {
  it("keeps most of the library but only palettes with a dark-to-light spread", () => {
    expect(SHUFFLE_PALETTES.length).toBeGreaterThanOrEqual(150);
    for (const p of SHUFFLE_PALETTES)
      expect(lightSpread(p)).toBeGreaterThanOrEqual(MIN_LIGHT_SPREAD);
  });

  it("leaves out one-value palettes such as an all-pastel one", () => {
    const pastel = ["#ffc8dd", "#bde0fe", "#caffbf", "#fdffb6"];
    expect(lightSpread(pastel)).toBeLessThan(MIN_LIGHT_SPREAD);
    expect(SHUFFLE_PALETTES.map(key)).not.toContain(key(pastel));
  });
});

describe("designerColors", () => {
  it("returns 4 hex colours", () => {
    const c = designerColors();
    expect(c).toHaveLength(4);
    for (const x of c) expect(x).toMatch(HEX);
  });

  it("is deterministic for an injected rng", () => {
    expect(designerColors(mulberry32(7))).toEqual(designerColors(mulberry32(7)));
  });

  it("with no twist (rng 0.5 for the shift) returns a library palette unchanged", () => {
    // rng: pick → 0, then 0.5 for hue and lightness = no change.
    const seq = [0, 0.5, 0.5];
    let i = 0;
    const c = designerColors(() => seq[i++ % seq.length]);
    expect(c).toEqual(SHUFFLE_PALETTES[0]);
  });

  it("keeps each colour's lightness close to its source and turns the hues by at most the shift", () => {
    for (let n = 0; n < 300; n++) {
      // designerColors draws the palette first, so the same seed names its source.
      const source = SHUFFLE_PALETTES[Math.floor(mulberry32(n)() * SHUFFLE_PALETTES.length)];
      const out = designerColors(mulberry32(n));
      for (let k = 0; k < 4; k++) {
        const [l0, c0, h0] = hexToOklch(source[k]);
        const [l1, , h1] = hexToOklch(out[k]);
        expect(Math.abs(l1 - l0)).toBeLessThanOrEqual(l0 * (DESIGNER_LIGHT_SCALE - 1) + 0.02);
        // Hue only means something on coloured slots.
        if (c0 > 0.05) expect(hueDistance(h0, h1)).toBeLessThanOrEqual(DESIGNER_HUE_SHIFT + 4);
      }
    }
  });

  it("spreads over many different palettes", () => {
    const rng = mulberry32(1);
    const seen = new Set<string>();
    for (let n = 0; n < 200; n++) seen.add(key(designerColors(rng)));
    expect(seen.size).toBeGreaterThan(190);
    for (const c of seen) expect(lightSpread(c.split(","))).toBeGreaterThan(MIN_LIGHT_SPREAD * 0.8);
  });
});
