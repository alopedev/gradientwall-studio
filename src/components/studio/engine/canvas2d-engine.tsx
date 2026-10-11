import { composeWallpaper, paintWallpaper } from "@/lib/download/compose";
import { wallpaperFilename } from "@/lib/download/filename";
import { encodeWithFallback, type EncodeFormat } from "@/lib/download/encode";
import { browserDownloadSink, type Sink } from "@/lib/download/sink";
import {
  DEFAULT_CONTRAST,
  DEFAULT_LIGHT_ANGLE,
  STUDIO_BLUR,
  STUDIO_VIBRANCE,
  V1_DEFAULT_GRAIN,
} from "@/lib/defaults";
import { DEVICE_SIZES } from "@/lib/palettes";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import type { AdjustmentSpec, EngineCanvasProps, WallpaperEngine } from "./types";

const FORMATS: EncodeFormat[] = [
  { type: "image/webp", quality: 0.95 },
  { type: "image/jpeg", quality: 0.95 },
];

/** Let the browser paint the progress bar before the next heavy synchronous step. */
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** Sliders of the Canvas2D pipeline: the full set, since v1 renders every one of them. */
const ADJUSTMENTS: readonly AdjustmentSpec[] = [
  {
    key: "blur",
    label: "Softness",
    min: 10,
    max: 120,
    step: 1,
    default: STUDIO_BLUR,
    format: (v) => `${Math.round(v)}`,
  },
  {
    key: "grain",
    label: "Grain",
    min: 0,
    max: 100,
    step: 1,
    default: V1_DEFAULT_GRAIN,
    format: (v) => `${Math.round(v)}%`,
  },
  {
    key: "lightAngle",
    label: "Light",
    min: 0,
    max: 360,
    step: 1,
    default: DEFAULT_LIGHT_ANGLE,
    format: (v) => `${Math.round(v)}°`,
  },
  {
    key: "contrast",
    label: "Contrast",
    min: 0.5,
    max: 1.5,
    step: 0.01,
    default: DEFAULT_CONTRAST,
    format: (v) => v.toFixed(2),
  },
  {
    key: "vibrance",
    label: "Vibrance",
    min: 0.5,
    max: 1.5,
    step: 0.01,
    default: STUDIO_VIBRANCE,
    format: (v) => v.toFixed(2),
  },
];

function Canvas2DCanvas({ params, device, className, onBeforePaint }: EngineCanvasProps) {
  const size = DEVICE_SIZES[device];
  const ref = useFittedGradientCanvas(
    { nativeW: size.w, nativeH: size.h, ...params, beforePaint: onBeforePaint },
    [device, params],
  );
  return <canvas ref={ref} className={className} />;
}

/**
 * Current engine: the Canvas2D mesh/liquid/aurora pipeline. Thin adapter over
 * `src/lib/gradient` and `src/lib/download`, which stay untouched.
 */
export function createCanvas2DEngine(sink: Sink = browserDownloadSink): WallpaperEngine {
  return {
    id: "canvas2d",
    styles: [
      { id: "liquid", label: "Liquid" },
      { id: "aurora", label: "Aurora" },
      { id: "mesh", label: "Mesh" },
    ],
    adjustmentsFor: () => ADJUSTMENTS,
    Canvas: Canvas2DCanvas,
    paintThumbnail(canvas, params, { w, h }) {
      paintWallpaper(canvas, { ...params, w, h });
    },
    async exportWallpaper(params, device, onProgress) {
      const size = DEVICE_SIZES[device];
      onProgress?.(0.05);
      await nextFrame();
      // Rendering is one synchronous call, so progress moves by stage rather
      // than by pixel: render ≈ 60 %, encode ≈ 35 %, hand-off the rest.
      const canvas = composeWallpaper({ ...params, w: size.w, h: size.h });
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

export const canvas2DEngine = createCanvas2DEngine();
