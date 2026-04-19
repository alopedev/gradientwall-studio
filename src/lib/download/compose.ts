import { renderGradient } from "../gradient";
import type { Style } from "../palettes";
import type { ColorRamp } from "../gradient/spec";

export interface ComposeOpts {
  w: number;
  h: number;
  colors: ColorRamp;
  style: Style;
  blur: number;
  grain: number; // 0-100
  seed: number;
}

/**
 * Produce a fully-composed wallpaper canvas at the requested resolution:
 * base gradient + grain noise overlay.
 *
 * The `canvasFactory` is injectable for testability. Defaults to
 * `document.createElement("canvas")`.
 */
export function composeWallpaper(
  opts: ComposeOpts,
  canvasFactory: () => HTMLCanvasElement = () => document.createElement("canvas"),
): HTMLCanvasElement {
  const canvas = canvasFactory();
  renderGradient(canvas, {
    w: opts.w,
    h: opts.h,
    colors: opts.colors,
    style: opts.style,
    blur: opts.blur,
    seed: opts.seed,
  });
  applyGrainOverlay(canvas, opts.grain, canvasFactory);
  return canvas;
}

/**
 * Paint a grain-noise overlay onto the canvas using the memoized noise tile.
 * Exported for direct testing of the overlay call sequence.
 */
export function applyGrainOverlay(
  canvas: HTMLCanvasElement,
  grain: number,
  canvasFactory: () => HTMLCanvasElement = () => document.createElement("canvas"),
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.globalAlpha = (grain / 100) * 0.55;
  ctx.globalCompositeOperation = "overlay";
  const pattern = ctx.createPattern(getNoiseTile(canvasFactory), "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

let cachedNoiseTile: HTMLCanvasElement | null = null;

/**
 * Build the 256×256 noise tile once and reuse it across compose calls.
 * Saves a 65k-iteration ImageData loop per wallpaper.
 *
 * Exported mainly so tests can assert identity across calls.
 */
export function getNoiseTile(
  canvasFactory: () => HTMLCanvasElement = () => document.createElement("canvas"),
): HTMLCanvasElement {
  if (cachedNoiseTile) return cachedNoiseTile;
  const tile = 256;
  const noise = canvasFactory();
  noise.width = noise.height = tile;
  const nctx = noise.getContext("2d");
  if (!nctx) throw new Error("Cannot create noise tile");
  const id = nctx.createImageData(tile, tile);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 140;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  nctx.putImageData(id, 0, 0);
  cachedNoiseTile = noise;
  return noise;
}

/**
 * Reset the memoized noise tile. Test-only — production code never needs this.
 */
export function __resetNoiseTileForTests(): void {
  cachedNoiseTile = null;
}
