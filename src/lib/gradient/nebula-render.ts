/**
 * Nebula renderer — procedural cloud field rendered onto a Canvas2D context.
 *
 * Lives outside the layered `GradientSpec` pipeline because the visual is a
 * per-pixel value field (FBM-warped noise + palette mixing) rather than a
 * stack of radial / linear gradients. `paintWallpaper` branches on
 * `style === "nebula"` to delegate here and keeps the grain overlay step
 * shared with the rest of the styles.
 *
 * Pure computation (`computeNebulaImageData`) is split from the DOM wrapper
 * (`renderNebulaToCanvas`) so the value field is testable without a real
 * canvas — same separation as `spec.ts` ↔ `canvas2d.ts`.
 */

import { mulberry32 } from "./spec";

export interface NebulaParams {
  w: number;
  h: number;
  colors: readonly string[];
  seed: number;
  density?: number;
  lightAngle?: number;
}

type RGB = readonly [number, number, number];

function hexToRgb(hex: string): RGB {
  const m = hex.replace(/^#/, "");
  const v =
    m.length === 3
      ? parseInt(m[0] + m[0] + m[1] + m[1] + m[2] + m[2], 16)
      : parseInt(m, 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

function paletteLerp(palette: readonly RGB[], t: number): RGB {
  const n = palette.length;
  if (n === 1) return palette[0];
  const scaled = Math.min(0.9999999, Math.max(0, t)) * (n - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const a = palette[idx];
  const b = palette[idx + 1] ?? a;
  return [
    a[0] + (b[0] - a[0]) * frac,
    a[1] + (b[1] - a[1]) * frac,
    a[2] + (b[2] - a[2]) * frac,
  ];
}

/**
 * Default density used when callers omit it. Matches `DEFAULT_DENSITY` in
 * `palettes.ts`; duplicated here to avoid a circular import and to keep the
 * pure renderer self-contained.
 */
const DEFAULT_DENSITY = 0.5;

/**
 * Spatial-hash based value noise. Deterministic per (x, y, seed): the same
 * triple always returns the same float in [0, 1). Used as the building block
 * for FBM below — picked over a permutation table so the function is fully
 * pure with no module-level state.
 */
function hash2(x: number, y: number, seed: number): number {
  let n = (x * 374761393 + y * 668265263 + seed * 2654435761) | 0;
  n = (Math.imul(n ^ (n >>> 13), 1274126177)) | 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smoothstep(x - x0);
  const fy = smoothstep(y - y0);
  const v00 = hash2(x0, y0, seed);
  const v10 = hash2(x0 + 1, y0, seed);
  const v01 = hash2(x0, y0 + 1, seed);
  const v11 = hash2(x0 + 1, y0 + 1, seed);
  const a = v00 + (v10 - v00) * fx;
  const b = v01 + (v11 - v01) * fx;
  return a + (b - a) * fy;
}

function fbm(x: number, y: number, seed: number): number {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    v += valueNoise(x * freq, y * freq, seed + i * 17) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return v;
}

export function computeNebulaImageData(params: NebulaParams): Uint8ClampedArray {
  const { w, h, seed, colors } = params;
  const density = params.density ?? DEFAULT_DENSITY;
  const palette = colors.map(hexToRgb);
  const out = new Uint8ClampedArray(w * h * 4);
  // FBM frequency: ~3 cells across the long axis at 1× — gives broad, soft
  // bands instead of high-frequency speckle. The two FBM samples are taken
  // at different offsets and seeds so color choice and intensity vary
  // independently.
  const longAxis = Math.max(w, h);
  const scale = 3 / longAxis;
  // Density acts as cloud thickness: 0 collapses to flat mid-intensity,
  // 1 swings into deep shadows + bright highlights. The seed-perturbed jitter
  // (mulberry32) keeps the per-pixel offset deterministic but unique per seed.
  const jitter = mulberry32(seed);
  const ox = jitter() * 1000;
  const oy = jitter() * 1000;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x * scale + ox;
      const ny = y * scale + oy;
      const tColor = fbm(nx, ny, seed);
      const cloud = fbm(nx + 5.7, ny - 3.2, seed + 100);
      const intensity = 0.5 + (cloud - 0.5) * density * 1.4;
      const [r, g, b] = paletteLerp(palette, tColor);
      const idx = (y * w + x) * 4;
      out[idx] = clamp8(r * intensity);
      out[idx + 1] = clamp8(g * intensity);
      out[idx + 2] = clamp8(b * intensity);
      out[idx + 3] = 255;
    }
  }
  return out;
}

function clamp8(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

export function renderNebulaToCanvas(canvas: HTMLCanvasElement, params: NebulaParams): void {
  canvas.width = params.w;
  canvas.height = params.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const data = computeNebulaImageData(params);
  const id = ctx.createImageData(params.w, params.h);
  id.data.set(data);
  ctx.putImageData(id, 0, 0);
}
