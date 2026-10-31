import { clamp } from "./color";

/**
 * Lighter / darker (Àlex, 2026-10-31, mockup B): a tone curve over the
 * finished wallpaper, so it works the same on every style and material and
 * leaves the colours the user picked alone. Tone runs −100 (darker) .. 100
 * (lighter); 0 is the wallpaper as drawn.
 *
 * The curve is a per-channel gamma, `c ^ 2^(−tone/100 × TONE_STRENGTH)`: it
 * moves the mid-tones and keeps pure black and white, so a palette with an ink
 * colour still darkens (shifting the palette's lightness did not, on Ember).
 * The GPU draws it (`gradient-v2/material.ts`); the Canvas2D engine, for
 * browsers without WebGL2, runs the same curve on the pixels (`applyToneToCanvas`).
 *
 * Pure apart from `applyToneToCanvas`, which only reads and writes pixels.
 */
export const TONE_MIN = -100;
export const TONE_MAX = 100;
/** At ±100 the exponent is 2^∓1.2 (≈0.44 lighter, ≈2.3 darker): the mockups' strongest step. */
export const TONE_STRENGTH = 1.2;

export const clampTone = (tone: number): number =>
  Number.isFinite(tone) ? clamp(Math.round(tone), TONE_MIN, TONE_MAX) : 0;

/** Gamma exponent for a tone; exactly 1 at 0. */
export function toneExponent(tone = 0): number {
  const t = clampTone(tone);
  return t === 0 ? 1 : 2 ** ((-t / 100) * TONE_STRENGTH);
}

/** 8-bit lookup table of the curve: channel value in → value out. Identity at tone 0. */
export function toneLut(tone = 0): Uint8ClampedArray {
  const e = toneExponent(tone);
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = e === 1 ? v : Math.round(255 * (v / 255) ** e);
  return lut;
}

/** RGB of RGBA pixels through the curve, in place (alpha untouched). */
export function applyToneToPixels(data: Uint8ClampedArray, tone = 0): void {
  if (clampTone(tone) === 0) return;
  const lut = toneLut(tone);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]!]!;
    data[i + 1] = lut[data[i + 1]!]!;
    data[i + 2] = lut[data[i + 2]!]!;
  }
}

/** The curve over a 2D canvas, for wallpapers drawn without the GPU pass. Returns the canvas. */
export function applyToneToCanvas<C extends HTMLCanvasElement>(canvas: C, tone = 0): C {
  if (clampTone(tone) === 0 || !canvas.width || !canvas.height) return canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyToneToPixels(img.data, tone);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Slider text: "0", "+25", "−25". */
export const formatTone = (tone: number): string => {
  const t = clampTone(tone);
  return t > 0 ? `+${t}` : t < 0 ? `−${-t}` : "0";
};
