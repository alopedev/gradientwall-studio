import { type DependencyList, type RefObject, useEffect, useRef } from "react";
import { fitCanvasSize } from "./fitted-canvas";

export interface FittedCanvasSpec {
  /**
   * Element whose clientWidth × clientHeight drives the canvas resolution.
   * Omit to use the canvas's own parentElement, which fits the usual
   * `<canvas w-full h-full>` inside a flex/grid parent.
   */
  containerRef?: RefObject<HTMLElement | null>;
  /** Native size of the wallpaper: fixes the aspect and caps the resolution. */
  nativeW: number;
  nativeH: number;
  /** Longest canvas side in pixels. Default 2400. */
  maxDim?: number;
  /** devicePixelRatio cap. Default 2. */
  maxDpr?: number;
  /**
   * Identity of the pixels (see `pixelKey`), without the size: the hook adds
   * it. An unchanged key at an unchanged size skips `paint`.
   */
  contentKey: string;
  /** Paint the wallpaper at `size`. Must also size the canvas. */
  paint: (canvas: HTMLCanvasElement, size: { w: number; h: number }) => void;
  /**
   * Called with the live canvas right before it is repainted. Only fires AFTER
   * the first paint, so a cross-fade overlay never snapshots an empty bitmap.
   */
  beforePaint?: (canvas: HTMLCanvasElement) => void;
  /** Runs after every pass, painted or not (e.g. a CSS filter that needs no repaint). */
  sync?: (canvas: HTMLCanvasElement) => void;
}

/**
 * Keep a `<canvas>` painted at its container's CSS size × DPR (crisp on
 * Retina, capped so huge frames stay cheap). Returns the ref for the canvas.
 *
 * The setup effect owns the ResizeObserver and a rAF coalescer, and re-runs
 * only when the native size changes (a device switch). `deps` is the repaint
 * trigger: when it changes the hook schedules a pass, which paints only if the
 * fitted size or `contentKey` changed. The latest `spec` is read through a
 * ref, so `paint` / `beforePaint` may close over fresh props without
 * resubscribing the observer.
 */
export function useFittedCanvas(
  spec: FittedCanvasSpec,
  deps: DependencyList,
): RefObject<HTMLCanvasElement> {
  const ref = useRef<HTMLCanvasElement>(null);
  const specRef = useRef(spec);
  specRef.current = spec;
  const scheduleRef = useRef<() => void>(() => {});

  // biome-ignore lint/correctness/useExhaustiveDependencies: the observer is rebuilt only for a new native size; everything else is read through specRef.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const container = spec.containerRef?.current ?? canvas.parentElement;
    if (!container) return;

    let raf = 0;
    let lastKey = "";

    const pass = () => {
      const cur = specRef.current;
      const host = cur.containerRef?.current ?? canvas.parentElement;
      if (!host) return;
      const size = fitCanvasSize({
        cssW: host.clientWidth,
        cssH: host.clientHeight,
        nativeW: cur.nativeW,
        nativeH: cur.nativeH,
        dpr: window.devicePixelRatio,
        maxDim: cur.maxDim,
        maxDpr: cur.maxDpr,
      });
      if (!size) return;

      const key = `${size.w}x${size.h}|${cur.contentKey}`;
      if (key !== lastKey) {
        if (lastKey !== "") cur.beforePaint?.(canvas);
        lastKey = key;
        cur.paint(canvas, size);
      }
      cur.sync?.(canvas);
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        pass();
      });
    };
    scheduleRef.current = schedule;

    // Paint once synchronously: under StrictMode the immediate cleanup drops
    // the first rAF tick.
    pass();

    const ro = new ResizeObserver(schedule);
    ro.observe(container);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      scheduleRef.current = () => {};
    };
  }, [spec.nativeW, spec.nativeH]);

  useEffect(() => {
    scheduleRef.current();
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps is the hook contract
  }, deps);

  return ref;
}
