/**
 * Pure helpers for the animated page backdrop (the v2 shader moving behind the
 * first screen). No DOM, no WebGL: sizing, palette easing and the "should it
 * run at all" rule. The component that uses them is `HeroBackdrop`.
 */

import { clamp, hexToRgb, rgbToHex } from "../color";

/** Fraction of the CSS box the field is rendered at; the browser upscales it. */
export const BACKDROP_SCALE = 0.3;
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

/**
 * rAF timestamps are coarsened (Chrome: 0.1 ms), so two 60 Hz frames can read
 * 33.3 ms, just under 1000 / 30. Without some slack every other drawn frame is
 * skipped and the field stutters between 30 and 20 fps.
 */
const FRAME_SLACK_MS = 4;

/** Whether enough time has passed since the last drawn frame to draw another. */
export function frameDue(elapsedMs: number, minFrameMs = BACKDROP_MIN_FRAME_MS): boolean {
  return elapsedMs >= minFrameMs - FRAME_SLACK_MS;
}

/** A box in CSS pixels (viewport space, as `getBoundingClientRect` gives it). */
export interface CssRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A rectangle of drawing-buffer pixels, GL style: origin at the bottom left. */
export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The parts of the backdrop's drawing buffer worth shading: all of it minus
 * what sits under `occluder`, an opaque box drawn on top (the Studio frame).
 * Up to four bands around the hole, no pixel twice. The hole is shrunk by
 * `inset` CSS px (the box's rounded corners and border let the field through)
 * and rounded inwards, so a pixel the box doesn't fully hide is always drawn.
 */
export function visibleRegions(
  canvas: CssRect,
  occluder: CssRect | null,
  buffer: { width: number; height: number },
  inset = 0,
): PixelRect[] {
  const bw = buffer.width;
  const bh = buffer.height;
  const whole = [{ x: 0, y: 0, width: bw, height: bh }];
  if (!occluder || canvas.width <= 0 || canvas.height <= 0) return whole;

  const sx = bw / canvas.width;
  const sy = bh / canvas.height;
  // Hole in buffer columns / rows counted from the top, rounded inwards.
  const left = Math.max(0, Math.ceil((occluder.x + inset - canvas.x) * sx));
  const right = Math.min(bw, Math.floor((occluder.x + occluder.width - inset - canvas.x) * sx));
  const top = Math.max(0, Math.ceil((occluder.y + inset - canvas.y) * sy));
  const bottom = Math.min(bh, Math.floor((occluder.y + occluder.height - inset - canvas.y) * sy));
  if (right <= left || bottom <= top) return whole;

  // Rows [r0, r1) from the top become GL rows from the bottom.
  const band = (x: number, r0: number, width: number, r1: number): PixelRect => ({
    x,
    y: bh - r1,
    width,
    height: r1 - r0,
  });
  return [
    band(0, 0, bw, top),
    band(0, bottom, bw, bh),
    band(0, top, left, bottom),
    band(right, top, bw - right, bottom),
  ].filter((r) => r.width > 0 && r.height > 0);
}
