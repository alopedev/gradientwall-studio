import type { RenderParams } from "./palettes";

/** Longest canvas side, in pixels, for a live preview. */
export const DEFAULT_MAX_DIM = 2400;
/** devicePixelRatio cap for a live preview. */
export const DEFAULT_MAX_DPR = 2;

export interface FitInput {
  /** CSS size of the box the canvas lives in. */
  cssW: number;
  cssH: number;
  /** Native size of the wallpaper; fixes the aspect and caps the resolution. */
  nativeW: number;
  nativeH: number;
  /** `window.devicePixelRatio`; capped by `maxDpr`. */
  dpr: number;
  maxDim?: number;
  maxDpr?: number;
}

/**
 * Pixel size of a preview canvas that fits a CSS box at the wallpaper's native
 * aspect, × DPR, capped at `maxDim` on the longest side and at the native size.
 * `null` while the box has no size yet (not laid out, or hidden).
 *
 * The `<canvas>` is stretched to its box, so the painted aspect must equal the
 * native aspect or the image would squish.
 */
export function fitCanvasSize(input: FitInput): { w: number; h: number } | null {
  const { cssW, cssH, nativeW, nativeH } = input;
  if (cssW <= 0 || cssH <= 0) return null;
  const maxDim = input.maxDim ?? DEFAULT_MAX_DIM;
  const dpr = Math.min(input.dpr || 1, input.maxDpr ?? DEFAULT_MAX_DPR);
  const ratio = nativeW / nativeH;

  let w = Math.min(cssW, cssH * ratio) * dpr;
  const longest = Math.max(w, w / ratio);
  if (longest > maxDim) w *= maxDim / longest;
  if (w > nativeW) w = nativeW;
  return { w: Math.round(w), h: Math.round(w / ratio) };
}

/** Which renderer paints the preview; they read different parameters. */
export type Pipeline = "v1" | "v2";

/**
 * Identity of everything in `params` that changes the painted pixels for a
 * given pipeline, as a string. Two equal keys (at the same size) mean a
 * repaint would produce the same bitmap, so the caller can skip it.
 *
 * - v1 (Canvas2D): style, colours, softness, seed, light, density and grain.
 *   Contrast / vibrance are left out on purpose: the preview applies them as a
 *   CSS filter, so dragging them must not repaint.
 * - v2 (WebGL): style, colours, seed, light and grain. The shader has no
 *   softness or density, so changing them (Remix does) leaves the pixels alone.
 *
 * A new parameter that reaches the pixels is added here, once.
 */
export function pixelKey(
  params: Pick<
    RenderParams,
    | "style"
    | "colors"
    | "blur"
    | "seed"
    | "lightAngle"
    | "density"
    | "grain"
    | "material"
    | "rotation"
  >,
  pipeline: Pipeline,
): string {
  const { style, colors, blur, seed, lightAngle, density, grain, material, rotation } = params;
  const ramp = colors.join(",");
  const fields =
    pipeline === "v1"
      ? [style, ramp, blur, seed, lightAngle, density, grain]
      : [style, ramp, seed, lightAngle, grain, material ?? "none", rotation ?? 0];
  return fields.join("|");
}
