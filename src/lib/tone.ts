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
 * The GPU draws it (`gradient-v2/material.ts`); the Canvas2D fallback for
 * browsers without WebGL2 draws the wallpaper without it.
 *
 * Pure: no DOM, no React.
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

/** Slider text: "0", "+25", "−25". */
export const formatTone = (tone: number): string => {
  const t = clampTone(tone);
  return t > 0 ? `+${t}` : t < 0 ? `−${-t}` : "0";
};
