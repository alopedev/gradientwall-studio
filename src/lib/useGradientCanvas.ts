import { useEffect, useRef, type DependencyList, type RefObject } from "react";
import { renderGradient, type RenderOpts } from "./gradient";
import { applyGrainOverlay } from "./download/compose";
import type { Style } from "./palettes";
import type { ColorRamp } from "./gradient/spec";

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
    renderGradient(canvas, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export interface FittedGradientOpts {
  /**
   * Element whose clientWidth × clientHeight drives the canvas resolution.
   * Omit to default to the canvas's own parentElement — works for the common
   * case where the `<canvas w-full h-full>` fills its flex/grid parent.
   */
  containerRef?: RefObject<HTMLElement | null>;
  /** Native aspect ratio source. Also used to cap the max resolution. */
  nativeW: number;
  nativeH: number;
  colors: ColorRamp;
  style: Style;
  blur: number;
  /** 0–100. If > 0, a bitmap grain overlay (WYSIWYG with download) is applied. */
  grain?: number;
  seed: number;
  /** Longest canvas side in pixels. Default 2400. */
  maxDim?: number;
  /** Effective devicePixelRatio cap. Default 2. */
  maxDpr?: number;
}

/**
 * Render a gradient into a `<canvas>` sized from its container's CSS box × DPR.
 *
 * Why: setting `canvas.width/height` to device pixels gives 1:1 sharpness on
 * Retina. The previous path pinned the canvas to ≤1200 px longest side with no
 * DPR scaling, so the browser upsampled a sub-resolved bitmap — the visible
 * "low quality" of the Studio preview.
 *
 * The container's rendered size drives resolution; the caller keeps CSS layout
 * control (aspect-ratio, max-w/h) on the container and sets `w-full h-full` on
 * the `<canvas>`. Re-renders on resize via ResizeObserver, rAF-coalesced so
 * slider drags and aspect-ratio transitions don't thrash the canvas.
 */
export function useFittedGradientCanvas(
  opts: FittedGradientOpts,
  deps: DependencyList,
): RefObject<HTMLCanvasElement> {
  const ref = useRef<HTMLCanvasElement>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const canvas = ref.current;
    const container = opts.containerRef?.current ?? canvas?.parentElement ?? null;
    if (!canvas || !container) return;

    const maxDim = opts.maxDim ?? 2400;
    const maxDpr = opts.maxDpr ?? 2;

    const paint = () => {
      const c = ref.current;
      const host = opts.containerRef?.current ?? c?.parentElement ?? null;
      if (!c || !host) return;

      const cssW = host.clientWidth;
      const cssH = host.clientHeight;
      if (cssW <= 0 || cssH <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const cur = optsRef.current;
      const ratio = cur.nativeW / cur.nativeH;

      // Fit the container box within the native aspect — the <canvas> is
      // stretched w-full/h-full, so the painted aspect must match the native
      // aspect to avoid squish. Use the smaller of (cssW, cssH×ratio) as
      // the driving width.
      let w = Math.min(cssW, cssH * ratio) * dpr;
      // Cap by longest side, then by native size (no upscaling beyond native).
      const longest = Math.max(w, w / ratio);
      if (longest > maxDim) w *= maxDim / longest;
      if (w > cur.nativeW) w = cur.nativeW;
      const h = w / ratio;

      renderGradient(c, {
        w: Math.round(w),
        h: Math.round(h),
        colors: cur.colors,
        style: cur.style,
        blur: cur.blur,
        seed: cur.seed,
      });
      if (cur.grain && cur.grain > 0) {
        applyGrainOverlay(c, cur.grain);
      }
    };

    let rafId = 0;
    const scheduleDebounced = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        paint();
      });
    };

    // Paint synchronously on effect run — rAF indirection here caused the
    // initial paint to be swallowed under React StrictMode double-effects.
    paint();
    const ro = new ResizeObserver(scheduleDebounced);
    ro.observe(container);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
