/**
 * Colour and number utilities shared by the gradient engines, the palette
 * generators and the Studio. Pure: no DOM, no React.
 *
 * `gradient/spec.ts` re-exports `hslToHex` / `hexToHsl` from here so existing
 * imports keep working; the bodies are the ones that were signed off there.
 */

export type RGB255 = [number, number, number];

/**
 * Parse `#rrggbb` or `#rgb` (case-insensitive, `#` optional, surrounding
 * whitespace ignored) into 0..255 channels, or `null` when it is neither.
 */
export function parseHex(hex: string): RGB255 | null {
  const m = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(m)) {
    return [parseInt(m[0] + m[0], 16), parseInt(m[1] + m[1], 16), parseInt(m[2] + m[2], 16)];
  }
  if (/^[0-9a-f]{6}$/i.test(m)) {
    return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
  }
  return null;
}

/** `#rrggbb` → 0..255 channels. Invalid input is black; this never throws. */
export function hexToRgb(hex: string): RGB255 {
  return parseHex(hex) ?? [0, 0, 0];
}

/** 0..255 channels → lowercase `#rrggbb`. Channels are rounded and clamped. */
export function rgbToHex([r, g, b]: readonly [number, number, number]): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const c = lNorm - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
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
  const rgb = parseHex(hex);
  if (!rgb) return [0, 0, 0];
  const [r, g, b] = rgb;
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

/** WCAG 2 relative luminance of a hex colour, 0 (black) .. 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two hex colours, 1 .. 21, order-independent. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const clamp = (n: number, min: number, max: number): number =>
  n < min ? min : n > max ? max : n;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Wrap any angle in degrees into `[0, 360)`. */
export const wrapAngle = (deg: number): number => ((deg % 360) + 360) % 360;
