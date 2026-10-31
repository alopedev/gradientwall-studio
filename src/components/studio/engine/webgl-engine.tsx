import { useEffect, useState } from "react";
import { exportFormat } from "@/lib/download/format";
import type { Sink } from "@/lib/download/sink";
import { DEFAULT_MAX_DIM, DEFAULT_MAX_DPR, pixelKey } from "@/lib/fitted-canvas";
import {
  isWebGL2Supported,
  paintV2,
  V2_DEFAULT_GRAIN,
  V2_DEFAULT_LIGHT_ANGLE,
  type V2Params,
  type V2Renderer,
} from "@/lib/gradient-v2";
import { DEFAULT_ROTATION, DEVICE_SIZES, engineOf, type RenderParams } from "@/lib/palettes";
import { useFittedCanvas } from "@/lib/useFittedCanvas";
import { lazy } from "./lazy";
import { ScreenMotion } from "./ScreenMotion";
import type { AdjustmentSpec, EngineCanvasProps, LookOption, WallpaperEngine } from "./types";
import { V1_ADJUSTMENTS } from "./v1-adjustments";
import type { V2Exporter } from "./webgl-export";

/** Longest preview side and DPR cap, same budget as the Canvas2D preview. */
const MAX_DIM = DEFAULT_MAX_DIM;
const MAX_DPR = DEFAULT_MAX_DPR;

const toV2 = (p: RenderParams): V2Params => ({
  colors: p.colors,
  style: p.style,
  seed: p.seed,
  lightAngle: p.lightAngle,
  grain: p.grain,
  material: p.material,
  rotation: p.rotation,
});

/** The shader has no softness / contrast / vibrance: its look is calibrated. */
const GRAIN: AdjustmentSpec = {
  key: "grain",
  label: "Grain",
  min: 0,
  max: 100,
  step: 1,
  default: V2_DEFAULT_GRAIN,
  format: (v) => `${Math.round(v)}%`,
};

/**
 * Turns the wallpaper (Àlex, 2026-10-31: the light barely showed). Aurora hangs
 * from the top of the screen and can't turn, so it keeps the Light slider.
 */
const ADJUSTMENTS: readonly AdjustmentSpec[] = [
  GRAIN,
  {
    key: "rotation",
    label: "Rotate",
    min: 0,
    max: 360,
    step: 1,
    default: DEFAULT_ROTATION,
    format: (v) => `${Math.round(v)}°`,
  },
];

const AURORA_ADJUSTMENTS: readonly AdjustmentSpec[] = [
  GRAIN,
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

/**
 * The Style picker (Àlex, 2026-10-31): the three styles and three materials,
 * each material over the style it reads best on. Ripple is drawn for favorites
 * and links that carry it, but left the picker (too close to Liquid).
 */
const LOOK_OPTIONS: readonly LookOption[] = [
  { id: "glass", label: "Glass", style: "mesh", material: "fluted" },
  { id: "dots", label: "Dots", style: "liquid", material: "halftone" },
  { id: "pixel", label: "Pixel", style: "mesh", material: "dither" },
  { id: "mesh", label: "Mesh", style: "mesh", material: "none" },
  { id: "aurora", label: "Aurora", style: "aurora", material: "none" },
  { id: "liquid", label: "Liquid", style: "liquid", material: "none" },
];

export interface WebGLEngineDeps {
  sink?: Sink;
  /**
   * Engine for favorites saved before v2 and for browsers without WebGL2.
   * Loaded the first time one of those shows up, not with the page.
   */
  loadFallback?: () => Promise<WallpaperEngine>;
  /** The Download pipeline, loaded on the first Download or ahead of it. */
  loadExporter?: () => Promise<V2Exporter>;
  supported?: () => boolean;
  renderer?: () => V2Renderer;
}

/**
 * The v2 engine (WebGL2 shader in `src/lib/gradient-v2`). Favorites saved
 * with v1 (`engine` absent or "v1") and browsers where the GPU path can't run
 * go through the v1 engine, so a saved wallpaper always looks the way it was
 * saved. The v1 engine and the Download pipeline load on demand: the first
 * screen only carries the shader preview.
 */
export function createWebGLEngine(deps: WebGLEngineDeps = {}): WallpaperEngine {
  const fallback = lazy(
    deps.loadFallback ?? (() => import("./canvas2d-engine").then((m) => m.canvas2DEngine)),
  );
  const exporter = lazy(deps.loadExporter ?? (() => import("./webgl-export")));
  const supported = deps.supported ?? isWebGL2Supported;
  const renderer = () => deps.renderer?.();

  /** Run `use` with the v1 engine: now when it has loaded, else once it arrives. */
  const withFallback = (use: (f: WallpaperEngine) => void): void | Promise<void> => {
    const ready = fallback.get();
    if (ready) return use(ready);
    return fallback.load().then(use);
  };

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
          if (!tryPaint(canvas, params, w, h)) {
            void withFallback((f) => f.paintThumbnail(canvas, params, { w, h }));
          }
        },
      },
      [params],
    );

    return <canvas ref={ref} className={className} />;
  }

  /**
   * A v1 favorite: the same bare canvas until the v1 engine arrives, then its
   * own preview. v1 looks only come from saved favorites and links, which load
   * after hydration, so the server and the first client render never differ.
   */
  function V1Canvas(props: EngineCanvasProps) {
    const [v1, setV1] = useState(fallback.get);
    useEffect(() => {
      if (v1) return;
      let live = true;
      fallback.load().then((f) => live && setV1(() => f));
      return () => {
        live = false;
      };
    }, [v1]);
    return v1 ? <v1.Canvas {...props} /> : <canvas className={props.className} />;
  }

  function EngineCanvas(props: EngineCanvasProps) {
    if (engineOf(props.params) === "v1") return <V1Canvas {...props} />;
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
    adjustmentsFor: (params) => {
      if (engineOf(params) === "v1") return V1_ADJUSTMENTS;
      return params.style === "aurora" ? AURORA_ADJUSTMENTS : ADJUSTMENTS;
    },
    // Only the shader draws materials; a v1 favorite keeps the plain style switch.
    looksFor: (params) => (engineOf(params) === "v1" ? [] : LOOK_OPTIONS),
    Canvas: EngineCanvas,
    Motion: ScreenMotion,
    paintThumbnail(canvas, params, size) {
      if (engineOf(params) === "v1" || !tryPaint(canvas, params, size.w, size.h)) {
        return withFallback((f) => f.paintThumbnail(canvas, params, size));
      }
    },
    exportFormat,
    prefetch(what) {
      void (what === "export" ? exporter.load() : fallback.load());
    },
    async exportWallpaper(params, device, onProgress) {
      if (engineOf(params) === "v1") {
        return (await fallback.load()).exportWallpaper(params, device, onProgress);
      }
      const { exportV2 } = await exporter.load();
      const file = await exportV2(toV2(params), device, {
        seed: params.seed,
        sink: deps.sink,
        supported,
        renderer: deps.renderer,
        onProgress,
      });
      return file ?? (await fallback.load()).exportWallpaper(params, device, onProgress);
    },
  };
}

export const webglEngine = createWebGLEngine();
