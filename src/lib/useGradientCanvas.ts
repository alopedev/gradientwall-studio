import { useEffect, useRef, type DependencyList, type RefObject } from "react";
import { type RenderOpts } from "./gradient";
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
export function useGradientCanvas(opts: RenderOpts, deps: DependencyList): RefObject<HTMLCanvasElement> {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    paintWallpaper(canvas, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
};

/**
 * Render a gradient into a `<canvas>` sized from its container's CSS box × DPR.
 *
 * Why: setting `canvas.width/height` to device pixels gives 1:1 sharpness on
 * Retina. The previous path pinned the canvas to ≤1200 px longest side with no
 * DPR scaling, so the browser upsampled a sub-resolved bitmap — the visible
 * "low quality" of the Studio preview.
 *
 * Implementation: setup effect (deps `[]`) owns the ResizeObserver and the
 * shared rAF coalescer. A second effect (deps `[deps]`) only schedules a
 * paint when params change — no observer churn per slider tick. An identity
 * check on (w,h,base-key) skips a full repaint when nothing semantically
 * changed (the cached pipeline in `compose.ts` then short-circuits the
 * gradient pass when only grain/grading shifted).
 */
export function useFittedGradientCanvas(
  opts: FittedGradientOpts,
  deps: DependencyList,
): RefObject<HTMLCanvasElement> {
  const ref = useRef<HTMLCanvasElement>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  // Schedule slot for the rAF coalescer; ref so both effects share it.
  const schedulerRef = useRef<{ schedule: () => void } | null>(null);

  // Setup effect — owns the ResizeObserver and the shared rAF scheduler.
  // Runs once on mount; survives every params change.
  useEffect(() => {
    const canvas = ref.current;
    const container = opts.containerRef?.current ?? canvas?.parentElement ?? null;
    if (!canvas || !container) return;

    let rafId = 0;
    let lastKey = "";

    const paint = () => {
      const c = ref.current;
      const host = optsRef.current.containerRef?.current ?? c?.parentElement ?? null;
      if (!c || !host) return;

      const cur = optsRef.current;
      const maxDim = cur.maxDim ?? 2400;
      const maxDpr = cur.maxDpr ?? 2;

      const cssW = host.clientWidth;
      const cssH = host.clientHeight;
      if (cssW <= 0 || cssH <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const ratio = cur.nativeW / cur.nativeH;

      // Fit the container box within the native aspect — the <canvas> is
      // stretched w-full/h-full, so the painted aspect must match the native
      // aspect to avoid squish.
      let w = Math.min(cssW, cssH * ratio) * dpr;
      const longest = Math.max(w, w / ratio);
      if (longest > maxDim) w *= maxDim / longest;
      if (w > cur.nativeW) w = cur.nativeW;
      const h = w / ratio;
      const wInt = Math.round(w);
      const hInt = Math.round(h);

      // Layered identity check: split the params into a bitmap key (anything
      // that affects pixels) and a grading triple (delegated to CSS filter).
      // Slider drags on brightness/contrast/vibrance only mutate the style —
      // no canvas work, no GC pressure. Slider drags on grain reuse the
      // cached gradient base so only the overlay step runs.
      const bitmapKey = `${wInt}x${hInt}|${cur.style}|${cur.colors.join(",")}|${cur.blur}|${cur.seed}|${cur.lightAngle}|${cur.density}|${cur.grain}`;
      const cssFilter = gradingCssFilter(cur.brightness, cur.contrast, cur.vibrance);
      if (bitmapKey !== lastKey) {
        lastKey = bitmapKey;
        paintWallpaperPreview(c, {
          w: wInt,
          h: hInt,
          colors: cur.colors,
          style: cur.style,
          blur: cur.blur,
          grain: cur.grain,
          seed: cur.seed,
          lightAngle: cur.lightAngle,
          density: cur.density,
          // Grading is applied via style.filter below, not by the painter.
          brightness: 1,
          contrast: 1,
          vibrance: 1,
        });
      }
      if (c.style.filter !== cssFilter) c.style.filter = cssFilter;
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        paint();
      });
    };

    schedulerRef.current = { schedule };

    // Initial paint synchronously — under StrictMode the rAF tick is dropped
    // by the immediate cleanup, so we must paint at least once on mount.
    paint();

    const ro = new ResizeObserver(schedule);
    ro.observe(container);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      schedulerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Params-change effect — cheap. Just nudges the scheduler; the setup effect
  // owns the actual painting and the identity check.
  useEffect(() => {
    schedulerRef.current?.schedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
