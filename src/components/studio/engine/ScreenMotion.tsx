import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { pixelKey } from "@/lib/fitted-canvas";
import {
  createRendererV2,
  frameDue,
  isSoftwareRenderer,
  isWebGL2Supported,
  screenMotionSize,
  shouldRunBackdrop,
  type V2Renderer,
  webglRendererName,
} from "@/lib/gradient-v2";
import { engineOf, type RenderParams } from "@/lib/palettes";
import { useMotionStore } from "@/store/useMotionStore";
import { prefersReducedMotion, saveDataOn } from "@/lib/motion";

/** What the visitor and their browser allow, read once on mount. */
function readEnv() {
  return {
    webgl2: isWebGL2Supported(),
    softwareGl: isSoftwareRenderer(webglRendererName()),
    reducedMotion: prefersReducedMotion(),
    saveData: saveDataOn(),
  };
}

/** Run `cb` once the main thread is free (or after `timeout` ms at the latest). */
function whenIdle(cb: () => void, timeout = 1500): () => void {
  if (typeof requestIdleCallback === "function" && typeof cancelIdleCallback === "function") {
    const cancel = cancelIdleCallback;
    const id = requestIdleCallback(cb, { timeout });
    return () => cancel(id);
  }
  const id = setTimeout(cb, 200);
  return () => clearTimeout(id);
}

/**
 * How long a new wallpaper stays still before it starts to drift: the circular
 * reveal (`DeviceStage`, at most `REVEAL_MS`) plays on the still canvas underneath meanwhile.
 */
export const SCREEN_MOTION_HOLD_MS = 500;

/**
 * The wallpaper on the Studio's device screen, drifting slowly (identity B,
 * 2026-10-12: the page is still paper; the movement lives inside the frame).
 * It draws the same look as the still canvas under it with the animated shader,
 * which has zero drift at t = 0, so fading it in changes nothing until time
 * moves. A new wallpaper hides it and restarts it at t = 0 once the reveal is
 * over.
 *
 * It owns its own WebGL context, draws about 30 fps and only while the Studio
 * is on screen and the tab is visible. Without WebGL2, with reduced motion or
 * data saver, for favorites saved with the v1 engine, or if the GPU path fails,
 * it renders nothing and the still wallpaper is all there is.
 */
export function ScreenMotion({ params }: { params: RenderParams }) {
  // Decided after mount: the prerendered HTML and the first client render match.
  const [enabled, setEnabled] = useState(false);
  useEffect(() => setEnabled(shouldRunBackdrop(readEnv())), []);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(false);
  const [hidden, setHidden] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<V2Renderer | null>(null);
  const inView = useInView(canvasRef);

  const look = useRef(params);
  const clock = useRef(0);
  /** Seconds of drawn time since the current look arrived. */
  const held = useRef(0);
  const key = pixelKey(params, "v2");
  // `key` names exactly what reaches the pixels: restart only when it changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the trigger, `params` is read whole
  useEffect(() => {
    look.current = params;
    clock.current = 0;
    held.current = 0;
    setShown(false);
  }, [key]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    return whenIdle(() => {
      try {
        setRenderer(createRendererV2(canvas, { animated: true }));
      } catch {
        setFailed(true);
      }
    });
  }, [enabled]);

  const paused = useMotionStore((s) => s.paused);
  const v2 = engineOf(params) === "v2";
  // Paused, the last frame stays on screen; play resumes from the same time.
  const active = enabled && v2 && !failed && inView && !hidden && !paused;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !renderer || !canvas) return;

    let raf = 0;
    let last: number | null = null;
    const frame = (now: number) => {
      if ((last !== null && !frameDue(now - last)) || !renderer.isReady()) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (renderer.isContextLost()) {
        setFailed(true);
        return;
      }
      // After a pause `last` is null again, so time resumes instead of jumping.
      const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;
      const holding = held.current * 1000 < SCREEN_MOTION_HOLD_MS;
      held.current += dt;
      // Time stands at 0 while the reveal plays: the frame matches the still.
      if (!holding) clock.current += dt;
      const p = look.current;
      const { width, height } = screenMotionSize(
        canvas.clientWidth,
        canvas.clientHeight,
        window.devicePixelRatio || 1,
      );
      try {
        renderer.draw(
          {
            colors: p.colors,
            style: p.style,
            seed: p.seed,
            grain: p.grain,
            lightAngle: p.lightAngle,
            material: p.material,
            rotation: p.rotation,
            tone: p.tone,
          },
          width,
          height,
          { time: clock.current },
        );
      } catch {
        setFailed(true);
        return;
      }
      if (held.current * 1000 >= SCREEN_MOTION_HOLD_MS) setShown(true);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, renderer]);

  if (!enabled || !v2 || failed) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-[3] size-full transition-opacity duration-500 motion-reduce:transition-none ${
        shown ? "opacity-100" : "opacity-0 duration-0"
      }`}
    />
  );
}
