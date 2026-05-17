import type { Colors4, RenderParams } from "../palettes";

// `ColorRamp` is owned by `palettes.ts` (alongside `RenderParams`) and
// re-exported here for back-compat with consumers that imported it from
// the gradient barrel.
export type { ColorRamp } from "../palettes";

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
 * Inverse of {@link hslToHex}. Accepts `#rrggbb` or `#rgb` (case-insensitive,
 * leading `#` optional) and returns `[h 0..360, s 0..100, l 0..100]`. Used by
 * the ColorHUD to keep the hex input and HSL sliders in two-way sync.
 *
 * Returns `[0, 0, 0]` for invalid input — callers should validate the hex
 * upfront via the regex used by the input itself; this function never throws.
 */
export function hexToHsl(hex: string): [number, number, number] {
  const m = hex.trim().replace(/^#/, "");
  let r = 0;
  let g = 0;
  let b = 0;
  if (/^[0-9a-f]{3}$/i.test(m)) {
    r = parseInt(m[0] + m[0], 16);
    g = parseInt(m[1] + m[1], 16);
    b = parseInt(m[2] + m[2], 16);
  } else if (/^[0-9a-f]{6}$/i.test(m)) {
    r = parseInt(m.slice(0, 2), 16);
    g = parseInt(m.slice(2, 4), 16);
    b = parseInt(m.slice(4, 6), 16);
  } else {
    return [0, 0, 0];
  }
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
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

/**
 * Renderer input. Drops `grain` from the canonical `RenderParams` (grain is
 * a Canvas overlay applied by `compose.ts`, not by spec.ts) and adds raster
 * dimensions. `lightAngle` stays optional so snapshot tests that omit it
 * produce the same byte-output as before lighting existed.
 */
export type SpecOpts = Omit<RenderParams, "grain"> & {
  w: number;
  h: number;
};

/**
 * Compute a GradientSpec from options. Pure, deterministic (given `seed`), no DOM.
 * This is the core product math — everything that makes a wallpaper "look right"
 * lives here, isolated from the Canvas renderer for snapshot-testability.
 *
 * Throws when `style === "nebula"` — Nebula is a WebGL one-shot rendered from
 * `lib/gradient/nebula-render.ts`, not a Canvas2D layer stack. Callers that
 * need to handle every style go through `paintWallpaper` (in `download/
 * compose.ts`), which branches on style before reaching here.
 */
export function buildGradientSpec(opts: SpecOpts): GradientSpec {
  const { w, h, colors, style, blur, seed, lightAngle } = opts;
  if (style === "nebula") {
    throw new Error(
      "buildGradientSpec does not handle the Nebula style — render via paintWallpaper or renderNebulaToCanvas instead.",
    );
  }
  // After the blobs removal, none of the canvas2d styles vary their layer
  // count by density (mesh = colors.length, liquid = 6, aurora = 2 bands per
  // color). Density is still surfaced through `SpecOpts` for type compatibility
  // with the WebGL Nebula path, but ignored here.
  const rand = mulberry32(seed);
  const blurPx = (blur / 100) * Math.min(w, h) * 0.35;
  const background = colors[0];
  const layers: Layer[] = [];

  if (style === "mesh") {
    // Mesh is fixed at one radial per color — density does not change layer
    // count; it would compete with the mask-driven 2..4 ramp. (Future: scale
    // r or cluster offsets by density.)
    for (let i = 0; i < colors.length; i++) {
      const c = colors[i];
      const cx = (0.25 + rand() * 0.5) * w * (i % 2 === 0 ? 0.7 : 1.3) * 0.8 + (i % 2) * w * 0.3;
      const cy = (0.15 + i / colors.length) * h + (rand() - 0.5) * h * 0.2;
      const r = Math.min(w, h) * (0.55 + rand() * 0.35);
      layers.push({
        fill: {
          kind: "radial",
          cx,
          cy,
          r,
          stops: [
            { offset: 0, color: c },
            { offset: 1, color: c + "00" },
          ],
        },
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
    // 2 bands per color → every active color contributes equally to the wash.
    // Floor of 6 keeps the layered feel intact when the user has only 2-3
    // active slots (with 4 active we get 8 bands; with 2 active, still 6).
    const bands = Math.max(6, colors.length * 2);
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
          stops: [
            { offset: 0, color: c + "cc" },
            { offset: 1, color: c + "00" },
          ],
        },
      });
    }
    // Central white highlight — the visual signature that defines the liquid
    // style. Alpha at 0.40 so the crown survives high softness values
    // (otherwise blur ≥ 60 collapses it into the radial wash).
    layers.push({
      fill: {
        kind: "radial",
        cx: w * 0.5,
        cy: h * 0.3,
        r: Math.min(w, h) * 0.5,
        stops: [
          { offset: 0, color: "rgba(255,255,255,0.4)" },
          { offset: 1, color: "rgba(255,255,255,0)" },
        ],
      },
    });
  }

  // Painterly highlight layer — biases brightness toward the user's chosen
  // light direction so two gradients with the same seed differ noticeably at
  // different angles. Omitted entirely when `lightAngle` is undefined to
  // preserve the legacy "spec for the seed" output for callers that don't
  // care about lighting (snapshot tests, recovery flows, etc.).
  if (lightAngle !== undefined) {
    const rad = (lightAngle * Math.PI) / 180;
    // Compass: 0° = top, 90° = right, in screen coords (y grows down).
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    // Bright highlight pushed toward the light source. Alpha raised from 0.18
    // → 0.32 (aligned with the Nebula path's biasMag of 0.32) so a 90° turn
    // of the dial is visible without staring.
    layers.push({
      fill: {
        kind: "radial",
        cx: w * 0.5 + dx * w * 0.42,
        cy: h * 0.5 + dy * h * 0.42,
        r: Math.max(w, h) * 0.85,
        stops: [
          { offset: 0, color: "rgba(255,255,255,0.32)" },
          { offset: 0.55, color: "rgba(255,255,255,0.08)" },
          { offset: 1, color: "rgba(255,255,255,0)" },
        ],
      },
    });
    // Soft shadow on the opposite side. Pairs with the highlight to produce a
    // "direction" cue instead of a lone bright spot — turning the dial now
    // reads as light rotating around the wallpaper, not just a moving glare.
    layers.push({
      fill: {
        kind: "radial",
        cx: w * 0.5 - dx * w * 0.42,
        cy: h * 0.5 - dy * h * 0.42,
        r: Math.max(w, h) * 0.85,
        stops: [
          { offset: 0, color: "rgba(0,0,0,0.20)" },
          { offset: 0.55, color: "rgba(0,0,0,0.05)" },
          { offset: 1, color: "rgba(0,0,0,0)" },
        ],
      },
    });
  }

  return { w, h, blurPx, background, layers };
}
