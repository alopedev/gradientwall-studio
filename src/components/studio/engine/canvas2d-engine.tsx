import { composeWallpaper, paintWallpaper } from "@/lib/download/compose";
import { exportCanvas, exportFormat } from "@/lib/download/export";
import { defaultSink, type Sink } from "@/lib/download/sink";
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
export function createCanvas2DEngine(sink: Sink = defaultSink): WallpaperEngine {
  return {
    id: "canvas2d",
    styles: [
      { id: "mesh", label: "Mesh" },
      { id: "aurora", label: "Aurora" },
      { id: "liquid", label: "Liquid" },
    ],
    adjustmentsFor: () => ADJUSTMENTS,
    Canvas: Canvas2DCanvas,
    paintThumbnail(canvas, params, { w, h }) {
      paintWallpaper(canvas, { ...params, w, h });
    },
    exportFormat,
    async exportWallpaper(params, device, onProgress) {
      const size = DEVICE_SIZES[device];
      const file = await exportCanvas(() => composeWallpaper({ ...params, w: size.w, h: size.h }), {
        device,
        seed: params.seed,
        sink,
        onProgress,
      });
      // composeWallpaper always returns a canvas, so this never happens.
      if (!file) throw new Error("Canvas2D export produced no canvas");
      return file;
    },
  };
}

export const canvas2DEngine = createCanvas2DEngine();
