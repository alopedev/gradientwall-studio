import type { Colors4, GradientConfig } from "../palettes";

/**
 * Seeded PRNG — mulberry32. Ported 1:1 from the original prototype.
 */
export function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedToHex(s: number): string {
  return "#" + (s & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const c = l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return "#" + f(0) + f(8) + f(4);
}

/**
 * Generate an HSL-based 4-color set with dark/mid/mid/light distribution.
 * Used by the Random button.
 */
export function randomColors(): Colors4 {
  const hueBase = Math.random() * 360;
  const offsets = [0, 40 + Math.random() * 30, 150 + Math.random() * 40, 250 + Math.random() * 40];
  const lights = [14, 32, 60, 82];
  const sats = [55, 70, 78, 72];
  return offsets.map((off, i) => {
    const h = (hueBase + off) % 360;
    return hslToHex(h, sats[i], lights[i]);
  }) as Colors4;
}

// ============================================================================
// Gradient spec — data-only description of what to paint.
// ============================================================================

export interface Stop {
  offset: number; // 0..1
  color: string; // "#RRGGBB" | "#RRGGBBAA" | "rgba(...)"
}

export interface RadialFill {
  kind: "radial";
  cx: number;
  cy: number;
  r: number;
  stops: Stop[];
}

export interface SolidFill {
  kind: "solid";
  color: string;
}

export interface Layer {
  fill: RadialFill | SolidFill;
}

export interface GradientSpec {
  w: number;
  h: number;
  blurPx: number; // resolved pixel blur to apply to all layers
  background: string; // painted first as a solid rect
  layers: Layer[]; // back-to-front, each paints a full w×h rect with `fill`
}

export type SpecOpts = Omit<GradientConfig, "grain"> & { w: number; h: number };

/**
 * Compute a GradientSpec from options. Pure, deterministic (given `seed`), no DOM.
 * This is the core product math — everything that makes a wallpaper "look right"
 * lives here, isolated from the Canvas renderer for snapshot-testability.
 */
export function buildGradientSpec(opts: SpecOpts): GradientSpec {
  const { w, h, colors, style, blur, seed } = opts;
  const rand = mulberry32(seed);
  const blurPx = (blur / 100) * Math.min(w, h) * 0.35;
  const background = colors[0];
  const layers: Layer[] = [];

  if (style === "mesh") {
    for (let i = 0; i < colors.length; i++) {
      const c = colors[i];
      const cx = (0.25 + rand() * 0.5) * w * (i % 2 === 0 ? 0.7 : 1.3) * 0.8 + (i % 2) * w * 0.3;
      const cy = (0.15 + i / colors.length) * h + (rand() - 0.5) * h * 0.2;
      const r = Math.min(w, h) * (0.55 + rand() * 0.35);
      layers.push({
        fill: { kind: "radial", cx, cy, r, stops: [{ offset: 0, color: c }, { offset: 1, color: c + "00" }] },
      });
    }
  } else if (style === "blobs") {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const c = colors[i % colors.length];
      const cx = rand() * w;
      const cy = rand() * h;
      const r = Math.min(w, h) * (0.2 + rand() * 0.3);
      layers.push({
        fill: { kind: "radial", cx, cy, r, stops: [{ offset: 0, color: c }, { offset: 1, color: c + "00" }] },
      });
    }
  } else if (style === "aurora") {
    // Vertical aurora-like flowing bands. Each color contributes 2-3 soft
    // elongated radial gradients stacked along the vertical axis, centered
    // on wandering x-coordinates — produces the classic "northern lights
    // draping down" look (macOS Sonoma wallpaper family).
    //
    // The radial is stretched vertically by using a very tall r and placing
    // the center above or below the canvas, so only the soft falloff shows.
    const bandsPerColor = 2;
    for (let ci = 0; ci < colors.length; ci++) {
      const c = colors[ci];
      for (let bi = 0; bi < bandsPerColor; bi++) {
        // x wanders across the width; each band gets a different slice
        const baseX = (ci + bi / bandsPerColor) / colors.length;
        const cx = (baseX + (rand() - 0.5) * 0.18) * w;
        // cy placed far above/below so only the soft edge of the gradient
        // reaches the canvas — creates the "curtain" fade look
        const above = bi % 2 === 0;
        const cy = above ? -h * (0.3 + rand() * 0.3) : h * (1.3 + rand() * 0.3);
        // Very large radius so the gradient covers the full height softly
        const r = h * (1.3 + rand() * 0.5);
        layers.push({
          fill: {
            kind: "radial",
            cx,
            cy,
            r,
            // Slight transparency (aa) gives overlapping bands a "blending"
            // feel without the harder edge of full-alpha mesh layers.
            stops: [
              { offset: 0, color: c + "aa" },
              { offset: 1, color: c + "00" },
            ],
          },
        });
      }
    }
    // Optional subtle horizon glow at the bottom (common in aurora photos)
    layers.push({
      fill: {
        kind: "radial",
        cx: w * 0.5,
        cy: h * 1.05,
        r: w * 0.8,
        stops: [
          { offset: 0, color: colors[colors.length - 1] + "55" },
          { offset: 1, color: colors[colors.length - 1] + "00" },
        ],
      },
    });
  } else if (style === "liquid") {
    const bands = 6;
    for (let i = 0; i < bands; i++) {
      const c = colors[i % colors.length];
      const cy = (i / bands) * h + (rand() - 0.5) * h * 0.3;
      const cx = rand() * w;
      const r = w * (0.7 + rand() * 0.5);
      layers.push({
        fill: {
          kind: "radial",
          cx,
          cy,
          r,
          stops: [{ offset: 0, color: c + "cc" }, { offset: 1, color: c + "00" }],
        },
      });
    }
    // Central white highlight
    layers.push({
      fill: {
        kind: "radial",
        cx: w * 0.5,
        cy: h * 0.3,
        r: Math.min(w, h) * 0.5,
        stops: [
          { offset: 0, color: "rgba(255,255,255,0.25)" },
          { offset: 1, color: "rgba(255,255,255,0)" },
        ],
      },
    });
  }

  return { w, h, blurPx, background, layers };
}
