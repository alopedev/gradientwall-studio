/**
 * Pure helpers for the animated page backdrop (the v2 shader moving behind the
 * first screen). No DOM, no WebGL: sizing, palette easing and the "should it
 * run at all" rule. The component that uses them is `HeroBackdrop`.
 */

import { clamp, hexToRgb, rgbToHex } from "../color";

/** Fraction of the CSS box the field is rendered at; the browser upscales it. */
export const BACKDROP_SCALE = 0.4;
export const BACKDROP_MIN_SIZE = { width: 320, height: 240 } as const;
/** Ceiling on pixels per frame, so a 5K screen costs no more than a laptop. */
export const BACKDROP_MAX_PIXELS = 360_000;
/** ~30 fps: the field drifts slowly, more frames would only burn battery. */
export const BACKDROP_MIN_FRAME_MS = 1000 / 30;
/** How fast the palette eases to a new one after a Shuffle (1/s of the remaining distance). */
export const BACKDROP_PALETTE_RATE = 2.2;
/** The noise seed is fixed: a Shuffle changes colours, and the shapes keep drifting. */
export const BACKDROP_SEED = 7;
/** Grain 0..100 as in the Studio slider; softer than the wallpaper itself. */
export const BACKDROP_GRAIN = 25;

export function backdropSize(
  cssWidth: number,
  cssHeight: number,
): { width: number; height: number } {
  let w = Math.max(BACKDROP_MIN_SIZE.width, cssWidth * BACKDROP_SCALE);
  let h = Math.max(BACKDROP_MIN_SIZE.height, cssHeight * BACKDROP_SCALE);
  const px = w * h;
  if (px > BACKDROP_MAX_PIXELS) {
    const k = Math.sqrt(BACKDROP_MAX_PIXELS / px);
    w *= k;
    h *= k;
  }
  return { width: Math.round(w), height: Math.round(h) };
}

export function mixHex(a: string, b: string, t: number): string {
  const k = clamp(t, 0, 1);
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  return rgbToHex(
    [0, 1, 2].map((i) => Math.round(ra[i] + (rb[i] - ra[i]) * k)) as [number, number, number],
  );
}

/**
 * One easing step of the palette toward `target`. Each channel moves at least
 * one level while it differs, so 8-bit rounding can't stall it short of the target.
 */
export function stepPalette(
  current: readonly string[],
  target: readonly string[],
  dtSeconds: number,
  rate = BACKDROP_PALETTE_RATE,
): string[] {
  const t = 1 - Math.exp(-rate * Math.max(0, dtSeconds));
  return target.map((to, i) => {
    const from = hexToRgb(current[i] ?? to);
    const goal = hexToRgb(to);
    if (t === 0) return rgbToHex(from);
    return rgbToHex(
      from.map((v, c) => {
        const diff = goal[c] - v;
        if (diff === 0) return v;
        const move = Math.round(diff * t) || Math.sign(diff);
        return v + (Math.abs(move) > Math.abs(diff) ? diff : move);
      }) as [number, number, number],
    );
  });
}

export interface BackdropEnv {
  webgl2: boolean;
  reducedMotion: boolean;
  saveData: boolean;
}

/** The backdrop moves only on the GPU path and only if the visitor hasn't asked for less. */
export function shouldRunBackdrop({ webgl2, reducedMotion, saveData }: BackdropEnv): boolean {
  return webgl2 && !reducedMotion && !saveData;
}
