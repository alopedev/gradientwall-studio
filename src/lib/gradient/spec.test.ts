import { describe, it, expect } from "vitest";
import { buildGradientSpec, mulberry32, seedToHex, hslToHex, type SpecOpts } from "./spec";
import type { Colors4 } from "../palettes";

const COLORS: Colors4 = ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"];
const baseOpts = (overrides: Partial<SpecOpts> = {}): SpecOpts => ({
  w: 1440,
  h: 3200,
  colors: COLORS,
  style: "mesh",
  blur: 48,
  seed: 12345,
  ...overrides,
});

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("returns values in [0, 1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("seedToHex", () => {
  it("formats the lower 16 bits as uppercase hex with leading #", () => {
    expect(seedToHex(0)).toBe("#0000");
    expect(seedToHex(255)).toBe("#00FF");
    expect(seedToHex(65535)).toBe("#FFFF");
    expect(seedToHex(65536)).toBe("#0000"); // wraps via & 0xffff
  });
});

describe("hslToHex", () => {
  it("returns pure white/black at lightness extremes", () => {
    expect(hslToHex(0, 0, 0)).toBe("#000000");
    expect(hslToHex(0, 0, 100)).toBe("#ffffff");
  });
  it("returns saturated primaries at expected hues", () => {
    expect(hslToHex(0, 100, 50)).toBe("#ff0000");
    expect(hslToHex(120, 100, 50)).toBe("#00ff00");
    expect(hslToHex(240, 100, 50)).toBe("#0000ff");
  });
});

describe("buildGradientSpec — structural invariants", () => {
  it("is deterministic for a given seed (same opts → identical spec)", () => {
    const a = buildGradientSpec(baseOpts({ seed: 999 }));
    const b = buildGradientSpec(baseOpts({ seed: 999 }));
    expect(a).toEqual(b);
  });

  it("background equals colors[0]", () => {
    const spec = buildGradientSpec(baseOpts());
    expect(spec.background).toBe(COLORS[0]);
  });

  it("blurPx = (blur/100) * min(w,h) * 0.35", () => {
    const spec = buildGradientSpec(baseOpts({ blur: 100, w: 1000, h: 2000 }));
    // min(1000, 2000) * 0.35 = 350
    expect(spec.blurPx).toBe(350);
  });

  it("blurPx scales linearly with blur 0..100", () => {
    const s0 = buildGradientSpec(baseOpts({ blur: 0 }));
    const s50 = buildGradientSpec(baseOpts({ blur: 50 }));
    const s100 = buildGradientSpec(baseOpts({ blur: 100 }));
    expect(s0.blurPx).toBe(0);
    expect(s50.blurPx).toBeCloseTo(s100.blurPx / 2, 5);
  });

  it("preserves w and h in the spec", () => {
    const spec = buildGradientSpec(baseOpts({ w: 5120, h: 2880 }));
    expect(spec.w).toBe(5120);
    expect(spec.h).toBe(2880);
  });

  it("mesh style produces exactly colors.length radial layers", () => {
    const spec = buildGradientSpec(baseOpts({ style: "mesh" }));
    expect(spec.layers).toHaveLength(4);
    spec.layers.forEach((l) => expect(l.fill.kind).toBe("radial"));
  });

  it("blobs style produces 14 radial layers", () => {
    const spec = buildGradientSpec(baseOpts({ style: "blobs" }));
    expect(spec.layers).toHaveLength(14);
    spec.layers.forEach((l) => expect(l.fill.kind).toBe("radial"));
  });

  it("liquid style produces 6 bands + 1 central highlight (7 layers)", () => {
    const spec = buildGradientSpec(baseOpts({ style: "liquid" }));
    expect(spec.layers).toHaveLength(7);
    const highlight = spec.layers[6].fill;
    expect(highlight.kind).toBe("radial");
    if (highlight.kind === "radial") {
      // Highlight is centered at (w/2, h*0.3)
      expect(highlight.cx).toBe(1440 / 2);
      expect(highlight.cy).toBe(3200 * 0.3);
      expect(highlight.stops[0].color).toBe("rgba(255,255,255,0.25)");
      expect(highlight.stops[1].color).toBe("rgba(255,255,255,0)");
    }
  });

  it("mesh/blobs stops end in fully transparent (#RRGGBB00) variant of the base color", () => {
    for (const style of ["mesh", "blobs"] as const) {
      const spec = buildGradientSpec(baseOpts({ style }));
      spec.layers.forEach((l) => {
        if (l.fill.kind !== "radial") return;
        const [start, end] = l.fill.stops;
        expect(end.color).toBe(start.color + "00");
      });
    }
  });

  it("liquid band stops use #RRGGBBcc start → #RRGGBB00 end", () => {
    const spec = buildGradientSpec(baseOpts({ style: "liquid" }));
    // First 6 layers are bands; layer 7 is the highlight (exempt)
    for (let i = 0; i < 6; i++) {
      const fill = spec.layers[i].fill;
      if (fill.kind !== "radial") throw new Error("expected radial");
      expect(fill.stops[0].color).toMatch(/^#[0-9a-f]{6}cc$/i);
      expect(fill.stops[1].color).toMatch(/^#[0-9a-f]{6}00$/i);
    }
  });

  it("is JSON-serializable (no functions, no cyclic refs)", () => {
    const spec = buildGradientSpec(baseOpts());
    expect(() => JSON.stringify(spec)).not.toThrow();
    const roundTripped = JSON.parse(JSON.stringify(spec));
    expect(roundTripped).toEqual(spec);
  });
});

describe("buildGradientSpec — regression snapshots", () => {
  // Capture a matrix of (style × seed) to guard the core math.
  // Any change to PRNG, positioning, or color encoding will surface here.
  const seeds = [12, 77, 42];
  const styles = ["mesh", "blobs", "liquid"] as const;

  for (const style of styles) {
    for (const seed of seeds) {
      it(`${style} @ seed ${seed}`, () => {
        const spec = buildGradientSpec(baseOpts({ style, seed, w: 1440, h: 3200 }));
        expect(spec).toMatchSnapshot();
      });
    }
  }
});
