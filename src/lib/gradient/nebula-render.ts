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
  /**
   * Compass-style angle in degrees (0 = North/top, 90 = East/right). When
   * defined, biases the vignette anchor towards that direction so the
   * brightest area of the composition follows the painterly light source.
   * When undefined the vignette stays centred — preserves byte-identical
   * output for legacy snapshots and pre-lightAngle history items.
   */
  lightAngle?: number;
  /**
   * Softness slider value 0..100. Applied as a Canvas2D filter on the final
   * upscale step in `renderNebulaToCanvas`; not used by the pure compute
   * path. Undefined / 0 → no blur.
   */
  blur?: number;
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
  // FBM at ~2.4 cells across the long axis — broad bands. Domain warping
  // (sampling FBM at coordinates that are themselves displaced by another
  // FBM) is what turns flat noise into the swirly whisp character of a real
  // nebula; without it the result looks like granite instead of clouds.
  const longAxis = Math.max(w, h);
  const scale = 2.4 / longAxis;
  // Per-seed offset so two seeds don't share the same starting region of
  // the noise field. Two extra offsets feed the warping samples so they
  // decorrelate from the base color/cloud lookups.
  const jitter = mulberry32(seed);
  const ox = jitter() * 1000;
  const oy = jitter() * 1000;
  const wx = jitter() * 100;
  const wy = jitter() * 100;
  // Warp strength tracks density: thinner density → flatter clouds, thicker
  // density → more dramatic swirls. Capped so wallpaper readability stays.
  const warp = 0.6 + density * 0.9;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  // Compass: 0 = North (up). In screen coords up is -y, right is +x.
  const biasMag = params.lightAngle === undefined ? 0 : 0.32;
  const angleRad = ((params.lightAngle ?? 0) * Math.PI) / 180;
  const lcx = cx + Math.sin(angleRad) * biasMag * cx;
  const lcy = cy + -Math.cos(angleRad) * biasMag * cy;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x * scale + ox;
      const ny = y * scale + oy;
      // Domain warping: displace sample coordinates by another FBM
      const wxF = fbm(nx + wx, ny + wy, seed + 33);
      const wyF = fbm(nx - wx, ny - wy, seed + 47);
      const px = nx + (wxF - 0.5) * warp;
      const py = ny + (wyF - 0.5) * warp;
      // Two independent FBMs: one drives palette position, the other drives
      // cloud thickness / intensity. Density modulates how much the cloud
      // value swings around the mid-tone.
      const tColor = fbm(px, py, seed);
      const cloud = fbm(px + 5.7, py - 3.2, seed + 100);
      // Highlight ridge: the top ~25% of the cloud value gets a brightness
      // boost so the densest regions read as luminous nebular cores rather
      // than just "lighter areas". Smoothed via smoothstep so the boundary
      // doesn't clip.
      const ridge = smoothstep(Math.max(0, (cloud - 0.62) / 0.38));
      const baseIntensity = 0.45 + (cloud - 0.5) * density * 1.6;
      const intensity = baseIntensity + ridge * 0.45 * density;
      // Vignette — drops 0..0.22 at the corners depending on density. With a
      // lightAngle bias the falloff becomes asymmetric: corners away from
      // the light direction darken more.
      const dx = x - lcx;
      const dy = y - lcy;
      const vignette = 1 - (Math.sqrt(dx * dx + dy * dy) / maxR) * 0.22 * density;
      const [r, g, b] = paletteLerp(palette, tColor);
      const k = intensity * vignette;
      const idx = (y * w + x) * 4;
      out[idx] = clamp8(r * k);
      out[idx + 1] = clamp8(g * k);
      out[idx + 2] = clamp8(b * k);
      out[idx + 3] = 255;
    }
  }
  return out;
}

function clamp8(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * Internal downsample factor for the FBM compute step. 0.5 means we compute
 * the value field at half resolution on each axis (¼ the pixel count) and
 * upscale via Canvas2D bilinear when blitting onto the destination. Nebula
 * is intrinsically soft (FBM + domain warping + ridge), so the upscale cost
 * is invisible while the perf saving is ~75% of the per-pixel work.
 */
const INTERNAL_SCALE = 0.5;

// Single shared offscreen canvas across all nebula paints. Slider drags fire
// dozens of paints per second; without memoization each one would allocate a
// new HTMLCanvasElement and let the previous one go to GC. JS is
// single-threaded so multiple destinations sharing one buffer is safe — each
// paint resizes to its own (sw, sh) before writing.
let cachedSmallCanvas: HTMLCanvasElement | null = null;

export function renderNebulaToCanvas(
  canvas: HTMLCanvasElement,
  params: NebulaParams,
  canvasFactory: () => HTMLCanvasElement = () => document.createElement("canvas"),
): void {
  canvas.width = params.w;
  canvas.height = params.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  // Compute at internal resolution → cheaper FBM loop. Round up so 1px
  // targets still produce a valid offscreen buffer.
  const sw = Math.max(2, Math.round(params.w * INTERNAL_SCALE));
  const sh = Math.max(2, Math.round(params.h * INTERNAL_SCALE));
  const small = cachedSmallCanvas ?? (cachedSmallCanvas = canvasFactory());
  small.width = sw;
  small.height = sh;
  const sctx = small.getContext("2d");
  if (!sctx) return;
  const data = computeNebulaImageData({ ...params, w: sw, h: sh });
  const id = sctx.createImageData(sw, sh);
  id.data.set(data);
  sctx.putImageData(id, 0, 0);
  // Upscale onto the destination, optionally with a Canvas2D blur filter
  // applied as Softness. The blur formula mirrors the GradientSpec path but
  // at ⅓ the strength — nebula is already soft, full-strength blur would
  // dissolve the structure entirely.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const blurPx =
    params.blur && params.blur > 0
      ? (params.blur / 100) * Math.min(params.w, params.h) * 0.12
      : 0;
  if (blurPx > 0) {
    ctx.filter = `blur(${blurPx}px)`;
    ctx.drawImage(small, 0, 0, sw, sh, 0, 0, params.w, params.h);
    ctx.filter = "none";
  } else {
    ctx.drawImage(small, 0, 0, sw, sh, 0, 0, params.w, params.h);
  }
}

/**
 * Reset the memoized offscreen canvas. Test-only — production code never
 * needs this.
 */
export function __resetNebulaCacheForTests(): void {
  cachedSmallCanvas = null;
}
