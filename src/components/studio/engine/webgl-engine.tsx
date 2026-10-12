import { paintWallpaper } from "@/lib/download/compose";
import { wallpaperFilename } from "@/lib/download/filename";
import { encodeWithFallback, exportFormatLabel, type EncodeFormat } from "@/lib/download/encode";
import { browserDownloadSink, type Sink } from "@/lib/download/sink";
import { DEFAULT_MAX_DIM, DEFAULT_MAX_DPR, pixelKey } from "@/lib/fitted-canvas";
import {
  isWebGL2Supported,
  paintV2,
  V2_DEFAULT_GRAIN,
  V2_DEFAULT_LIGHT_ANGLE,
  renderWallpaperV2,
  type V2Params,
  type V2Renderer,
} from "@/lib/gradient-v2";
import { DEVICE_SIZES, engineOf, type RenderParams } from "@/lib/palettes";
import { useFittedCanvas } from "@/lib/useFittedCanvas";
import { canvas2DEngine } from "./canvas2d-engine";
import type { AdjustmentSpec, EngineCanvasProps, WallpaperEngine } from "./types";

const FORMATS: EncodeFormat[] = [
  { type: "image/webp", quality: 0.95 },
  { type: "image/jpeg", quality: 0.95 },
];

/** Longest preview side and DPR cap, same budget as the Canvas2D preview. */
const MAX_DIM = DEFAULT_MAX_DIM;
const MAX_DPR = DEFAULT_MAX_DPR;

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

const toV2 = (p: RenderParams): V2Params => ({
  colors: p.colors,
  style: p.style,
  seed: p.seed,
  lightAngle: p.lightAngle,
  grain: p.grain,
});

/** The shader has no softness / contrast / vibrance: its look is calibrated. */
const ADJUSTMENTS: readonly AdjustmentSpec[] = [
  {
    key: "grain",
    label: "Grain",
    min: 0,
    max: 100,
    step: 1,
    default: V2_DEFAULT_GRAIN,
    format: (v) => `${Math.round(v)}%`,
  },
  {
    key: "lightAngle",
    label: "Light",
    min: 0,
    max: 360,
    step: 1,
    default: V2_DEFAULT_LIGHT_ANGLE,
    format: (v) => `${Math.round(v)}°`,
  },
];

export interface WebGLEngineDeps {
  sink?: Sink;
  /** Engine for favorites saved before v2 and for browsers without WebGL2. */
  fallback?: WallpaperEngine;
  supported?: () => boolean;
  renderer?: () => V2Renderer;
}

/**
 * The v2 engine (WebGL2 shader in `src/lib/gradient-v2`). Favorites saved
 * with v1 (`engine` absent or "v1") and browsers where the GPU path can't run
 * go through `fallback`, so a saved wallpaper always looks the way it was saved.
 */
export function createWebGLEngine(deps: WebGLEngineDeps = {}): WallpaperEngine {
  const sink = deps.sink ?? browserDownloadSink;
  const fallback = deps.fallback ?? canvas2DEngine;
  const supported = deps.supported ?? isWebGL2Supported;
  const renderer = () => deps.renderer?.();

  /** Paint v2 into `canvas`; false when the GPU path failed and v1 should paint instead. */
  const tryPaint = (canvas: HTMLCanvasElement, p: RenderParams, w: number, h: number) => {
    if (!supported()) return false;
    try {
      paintV2(canvas, toV2(p), w, h, {}, renderer());
      return true;
    } catch (err) {
      console.warn("[gradient-v2] preview failed, using v1", err);
      return false;
    }
  };

  function WebGLCanvas({ params, device, className, onBeforePaint }: EngineCanvasProps) {
    const size = DEVICE_SIZES[device];
    const ref = useFittedCanvas(
      {
        nativeW: size.w,
        nativeH: size.h,
        maxDim: MAX_DIM,
        maxDpr: MAX_DPR,
        contentKey: pixelKey(params, "v2"),
        beforePaint: onBeforePaint,
        paint: (canvas, { w, h }) => {
          if (!tryPaint(canvas, params, w, h)) paintWallpaper(canvas, { ...params, w, h });
        },
      },
      [params],
    );

    return <canvas ref={ref} className={className} />;
  }

  function EngineCanvas(props: EngineCanvasProps) {
    if (engineOf(props.params) === "v1") return <fallback.Canvas {...props} />;
    return <WebGLCanvas {...props} />;
  }

  return {
    id: "webgl-v2",
    styles: [
      // Rendered as v2 "grain-mesh" (see toV2Style).
      { id: "mesh", label: "Mesh" },
      { id: "aurora", label: "Aurora" },
      { id: "liquid", label: "Liquid" },
    ],
    // Favorites saved with v1 keep the v1 sliders: that is the renderer drawing them.
    adjustmentsFor: (params) =>
      engineOf(params) === "v1" ? fallback.adjustmentsFor(params) : ADJUSTMENTS,
    Canvas: EngineCanvas,
    paintThumbnail(canvas, params, size) {
      if (engineOf(params) === "v1" || !tryPaint(canvas, params, size.w, size.h)) {
        fallback.paintThumbnail(canvas, params, size);
      }
    },
    exportFormat: () => exportFormatLabel(FORMATS),
    async exportWallpaper(params, device, onProgress) {
      if (engineOf(params) === "v1") return fallback.exportWallpaper(params, device, onProgress);
      const size = DEVICE_SIZES[device];
      onProgress?.(0.05);
      await nextFrame();
      const canvas = renderWallpaperV2(toV2(params), size.w, size.h, {
        supported,
        renderer: deps.renderer,
      });
      if (!canvas) return fallback.exportWallpaper(params, device, onProgress);
      onProgress?.(0.65);
      await nextFrame();
      const { blob, ext } = await encodeWithFallback(canvas, FORMATS);
      onProgress?.(0.95);
      const filename = wallpaperFilename(device, params.seed, ext);
      await sink(blob, filename);
      onProgress?.(1);
      return { filename, bytes: blob.size };
    },
  };
}

export const webglEngine = createWebGLEngine();
