import { composeWallpaper, paintWallpaper } from "@/lib/download/compose";
import { exportCanvas } from "@/lib/download/export";
import { exportFormat } from "@/lib/download/format";
import { defaultSink, type Sink } from "@/lib/download/sink";
import { DEVICE_SIZES } from "@/lib/palettes";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import type { EngineCanvasProps, WallpaperEngine } from "./types";
import { V1_ADJUSTMENTS } from "./v1-adjustments";

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
    adjustmentsFor: () => V1_ADJUSTMENTS,
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
