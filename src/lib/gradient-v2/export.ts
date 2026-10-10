/**
 * Full-size v2 render for downloads. Returns a 2D canvas ready for
 * `encodeWithFallback`, or `null` when WebGL2 can't do it (no WebGL2,
 * clamped drawing buffer, lost context) so the caller can fall back to the
 * v1 `composeWallpaper`. Any other GPU error (e.g. a driver rejecting the
 * shader) is logged and also returns `null`.
 */

import type { V2Params } from "./params";
import {
  EXPORT_STRIP_ROWS,
  WebGL2UnavailableError,
  getSharedRendererV2,
  isWebGL2Supported,
  paintV2,
  type V2Renderer,
} from "./renderer";

export interface ExportV2Deps {
  canvasFactory?: () => HTMLCanvasElement;
  supported?: () => boolean;
  renderer?: () => V2Renderer;
}

export function renderWallpaperV2(
  params: V2Params,
  w: number,
  h: number,
  deps: ExportV2Deps = {},
): HTMLCanvasElement | null {
  const canvasFactory = deps.canvasFactory ?? (() => document.createElement("canvas"));
  if (!(deps.supported ?? isWebGL2Supported)()) return null;
  try {
    const renderer = (deps.renderer ?? (() => getSharedRendererV2(canvasFactory)))();
    const out = canvasFactory();
    paintV2(out, params, w, h, { strip: EXPORT_STRIP_ROWS }, renderer);
    return out;
  } catch (err) {
    // Any GPU-side failure (including a driver that rejects the shader)
    // degrades to the v1 engine instead of failing the download.
    if (!(err instanceof WebGL2UnavailableError)) console.warn("[gradient-v2] export failed", err);
    return null;
  }
}
