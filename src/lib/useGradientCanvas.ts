import { useEffect, useRef, type DependencyList, type RefObject } from "react";
import { DEFAULT_CONTRAST, DEFAULT_VIBRANCE } from "./defaults";
import { pixelKey } from "./fitted-canvas";
import { useFittedCanvas } from "./useFittedCanvas";
import type { RenderOpts } from "./gradient";
import { paintWallpaper, paintWallpaperPreview, gradingCssFilter } from "./download/compose";
import type { RenderParams } from "./palettes";

/**
 * Paint a gradient onto a `<canvas>` whenever its opts change.
 * Returns the ref to pass to the `<canvas>` element.
 *
 * Legacy fixed-size form. Prefer `useFittedGradientCanvas` for visible previews
 * — it drives the canvas resolution from the container's CSS size × DPR, which
 * keeps the wallpaper crisp on Retina and avoids the sub-resolved look.
 */
export function useGradientCanvas(
  opts: RenderOpts,
  deps: DependencyList,
): RefObject<HTMLCanvasElement> {
  const ref = useRef<HTMLCanvasElement>(null);
  // Caller passes `deps` as a runtime DependencyList — biome wants an array
  // literal but the whole point of this hook is to forward whatever the
  // caller decides drives a repaint.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    paintWallpaper(canvas, opts);
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps is the hook contract
  }, deps);
  return ref;
}

export type FittedGradientOpts = RenderParams & {
  /**
   * Element whose clientWidth × clientHeight drives the canvas resolution.
   * Omit to default to the canvas's own parentElement — works for the common
   * case where the `<canvas w-full h-full>` fills its flex/grid parent.
   */
  containerRef?: RefObject<HTMLElement | null>;
  /** Native aspect ratio source. Also used to cap the max resolution. */
  nativeW: number;
  nativeH: number;
  /** Longest canvas side in pixels. Default 2400. */
  maxDim?: number;
  /** Effective devicePixelRatio cap. Default 2. */
  maxDpr?: number;
  /**
   * Called with the live canvas right before it is repainted with new params.
   * Only fires AFTER the first paint (i.e., the canvas already has content).
   * Used by Preview for the cross-fade overlay: it snapshots the current
   * bitmap into a sibling canvas before the live one is overwritten.
   */
  beforePaint?: (canvas: HTMLCanvasElement) => void;
};

/**
 * Render a gradient into a `<canvas>` sized from its container's CSS box × DPR
 * (see `useFittedCanvas`), painting with the Canvas2D pipeline.
 *
 * Grading (contrast / vibrance) is applied as a CSS filter on the canvas, so
 * dragging those sliders never repaints; grain reuses the cached gradient base
 * in `paintWallpaperPreview`, so only the overlay step runs.
 */
export function useFittedGradientCanvas(
  opts: FittedGradientOpts,
  deps: DependencyList,
): RefObject<HTMLCanvasElement> {
  return useFittedCanvas(
    {
      containerRef: opts.containerRef,
      nativeW: opts.nativeW,
      nativeH: opts.nativeH,
      maxDim: opts.maxDim,
      maxDpr: opts.maxDpr,
      contentKey: pixelKey(opts, "v1"),
      beforePaint: opts.beforePaint,
      paint: (canvas, { w, h }) =>
        paintWallpaperPreview(canvas, {
          w,
          h,
          colors: opts.colors,
          style: opts.style,
          blur: opts.blur,
          grain: opts.grain,
          seed: opts.seed,
          lightAngle: opts.lightAngle,
          density: opts.density,
          // Grading is applied via style.filter in `sync`, not by the painter.
          contrast: DEFAULT_CONTRAST,
          vibrance: DEFAULT_VIBRANCE,
        }),
      sync: (canvas) => {
        const filter = gradingCssFilter(opts.contrast, opts.vibrance);
        if (canvas.style.filter !== filter) canvas.style.filter = filter;
      },
    },
    deps,
  );
}
