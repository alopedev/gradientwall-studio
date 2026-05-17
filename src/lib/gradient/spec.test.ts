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

  it("liquid style produces colors.length × 2 bands + 1 central highlight (4 colors → 9 layers)", () => {
    const spec = buildGradientSpec(baseOpts({ style: "liquid" }));
    // 4 colors × 2 bands = 8 + central highlight = 9 layers (no lightAngle
    // here, so no painterly highlight pair).
    expect(spec.layers).toHaveLength(9);
    const highlight = spec.layers[8].fill;
    expect(highlight.kind).toBe("radial");
    if (highlight.kind === "radial") {
      // Highlight is centered at (w/2, h*0.3)
      expect(highlight.cx).toBe(1440 / 2);
      expect(highlight.cy).toBe(3200 * 0.3);
      expect(highlight.stops[0].color).toBe("rgba(255,255,255,0.4)");
      expect(highlight.stops[1].color).toBe("rgba(255,255,255,0)");
    }
  });

  it("aurora style produces colors.length × 2 band layers + 1 horizon glow (9 layers)", () => {
    const spec = buildGradientSpec(baseOpts({ style: "aurora" }));
    // 4 colors × 2 bands each + 1 horizon = 9 layers
    expect(spec.layers).toHaveLength(9);
    spec.layers.forEach((l) => expect(l.fill.kind).toBe("radial"));
  });

  it("aurora bands are placed off-canvas vertically (curtain fade look)", () => {
    const spec = buildGradientSpec(baseOpts({ style: "aurora", w: 1000, h: 2000 }));
    // First 8 layers are the band pairs; band centers are either above (cy < 0)
    // or below (cy > h) the canvas. This is what creates the soft vertical drape.
    const bands = spec.layers.slice(0, 8);
    bands.forEach((layer) => {
      if (layer.fill.kind !== "radial") throw new Error("expected radial");
      const cy = layer.fill.cy;
      const offCanvas = cy < 0 || cy > 2000;
      expect(offCanvas).toBe(true);
    });
  });

  it("aurora uses semi-transparent #RRGGBBaa starts (soft blending) vs mesh opaque", () => {
    const spec = buildGradientSpec(baseOpts({ style: "aurora" }));
    // First 8 layers: bands. Check they start with the aa alpha suffix.
    for (let i = 0; i < 8; i++) {
      const fill = spec.layers[i].fill;
      if (fill.kind !== "radial") throw new Error("expected radial");
      expect(fill.stops[0].color).toMatch(/^#[0-9a-f]{6}aa$/i);
      expect(fill.stops[1].color).toMatch(/^#[0-9a-f]{6}00$/i);
    }
  });

  it("mesh stops end in fully transparent (#RRGGBB00) variant of the base color", () => {
    const spec = buildGradientSpec(baseOpts({ style: "mesh" }));
    spec.layers.forEach((l) => {
      if (l.fill.kind !== "radial") return;
      const [start, end] = l.fill.stops;
      expect(end.color).toBe(start.color + "00");
    });
  });

  it("liquid band stops use #RRGGBBcc start → #RRGGBB00 end", () => {
    const spec = buildGradientSpec(baseOpts({ style: "liquid" }));
    // With 4 colors: first 8 layers are bands; layer 9 is the central highlight.
    for (let i = 0; i < 8; i++) {
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

describe("buildGradientSpec — variable-length color ramps", () => {
  // The spec must accept ramps of 2-4 colors so the "deselect slots" UI works.
  // All four styles iterate via `colors.length` or `colors[i % length]` — no
  // hidden `[0..3]` dereferences that would crash on shorter inputs.

  it("accepts a 2-color ramp without errors", () => {
    expect(() => buildGradientSpec(baseOpts({ colors: ["#112233", "#aabbcc"] }))).not.toThrow();
  });

  it("mesh produces one radial per color in the ramp (2/3/4)", () => {
    expect(
      buildGradientSpec(baseOpts({ colors: ["#a", "#b"], style: "mesh" })).layers,
    ).toHaveLength(2);
    expect(
      buildGradientSpec(baseOpts({ colors: ["#a", "#b", "#c"], style: "mesh" })).layers,
    ).toHaveLength(3);
  });

  it("aurora produces colors.length × 2 bands + 1 horizon glow", () => {
    // 2 colors → 4 bands + 1 = 5
    expect(
      buildGradientSpec(baseOpts({ colors: ["#a", "#b"], style: "aurora" })).layers,
    ).toHaveLength(5);
    // 3 colors → 6 bands + 1 = 7
    expect(
      buildGradientSpec(baseOpts({ colors: ["#a", "#b", "#c"], style: "aurora" })).layers,
    ).toHaveLength(7);
  });

  it("liquid scales bands with the ramp (2 colors → 6, 3 colors → 6, 4 colors → 8) + 1 highlight", () => {
    // 2 colors → max(6, 2*2=4) = 6 bands + 1 highlight = 7 layers
    expect(
      buildGradientSpec(baseOpts({ colors: ["#a", "#b"], style: "liquid" })).layers,
    ).toHaveLength(7);
    // 3 colors → max(6, 3*2=6) = 6 bands + 1 highlight = 7 layers
    expect(
      buildGradientSpec(baseOpts({ colors: ["#a", "#b", "#c"], style: "liquid" })).layers,
    ).toHaveLength(7);
    // 4 colors → max(6, 4*2=8) = 8 bands + 1 highlight = 9 layers (the new
    // distribution that gives every active color equal representation).
    expect(
      buildGradientSpec(baseOpts({ colors: ["#a", "#b", "#c", "#d"], style: "liquid" })).layers,
    ).toHaveLength(9);
  });

  it("background is always colors[0] even when the ramp has only two entries", () => {
    const spec = buildGradientSpec(baseOpts({ colors: ["#112233", "#aabbcc"] }));
    expect(spec.background).toBe("#112233");
  });
});

describe("buildGradientSpec — regression snapshots", () => {
  // Capture a matrix of (style × seed) to guard the core math.
  // Any change to PRNG, positioning, or color encoding will surface here.
  const seeds = [12, 77, 42];
  const styles = ["mesh", "liquid", "aurora"] as const;

  for (const style of styles) {
    for (const seed of seeds) {
      it(`${style} @ seed ${seed}`, () => {
        const spec = buildGradientSpec(baseOpts({ style, seed, w: 1440, h: 3200 }));
        expect(spec).toMatchSnapshot();
      });
    }
  }
});
