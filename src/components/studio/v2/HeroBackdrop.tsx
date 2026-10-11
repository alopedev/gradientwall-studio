import { useInView } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import {
  BACKDROP_GRAIN,
  BACKDROP_SEED,
  backdropSize,
  createRendererV2,
  frameDue,
  isWebGL2Supported,
  shouldRunBackdrop,
  stepPalette,
  type V2Renderer,
  visibleRegions,
} from "@/lib/gradient-v2";
import { useConfigStore } from "@/store";

/** What the visitor and their browser allow, read once on mount. */
function readEnv() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return {
    webgl2: isWebGL2Supported(),
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: connection?.saveData === true,
  };
}

/** CSS px of the occluder's edge still shaded: its rounded corners and border let the field through. */
const OCCLUDER_INSET = 24;

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

interface Props {
  /**
   * An opaque box drawn over the backdrop (the Studio frame). Pixels under it
   * are never seen, so they are not shaded: about half the first screen.
   */
  occluderRef?: RefObject<HTMLElement | null>;
}

/**
 * The v2 shader moving slowly behind the first screen, tinted with the current
 * palette. A Shuffle eases its colours to the new ones. It sits on top of
 * `HeroAmbient`, which stays as the instant, free layer underneath: with no
 * WebGL2, with reduced motion or data saver, or if the GPU path fails, this
 * renders nothing and the ambient is all there is.
 *
 * It owns its own small WebGL context (a fraction of the screen size, about
 * 30 fps) and only draws while it is on screen and the tab is visible. The
 * context is created once the page is idle and the shader compiles in the
 * background, so the Studio's first wallpaper never waits for it.
 */
export function HeroBackdrop({ occluderRef }: Props = {}) {
  const [enabled] = useState(() => shouldRunBackdrop(readEnv()));
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);

  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<V2Renderer | null>(null);
  const inView = useInView(boxRef);

  const colors = useConfigStore((s) => s.colors);
  const target = useRef<readonly string[]>(colors);
  const palette = useRef<readonly string[]>(colors);
  const clock = useRef(0);
  useEffect(() => {
    target.current = colors;
  }, [colors]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // One renderer for the life of the component, created once the page is idle.
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

  const active = enabled && !failed && inView && !hidden;
  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!active || !renderer || !box || !canvas) return;

    let raf = 0;
    let last: number | null = null;
    // Buffer size and visible regions of the last frame drawn.
    let painted = "";
    let shown = false;
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
      clock.current += dt;
      palette.current = stepPalette(palette.current, target.current, dt);
      const { width, height } = backdropSize(box.clientWidth, box.clientHeight);
      const occluder = occluderRef?.current;
      const visible = occluder
        ? visibleRegions(
            canvas.getBoundingClientRect(),
            occluder.getBoundingClientRect(),
            { width, height },
            OCCLUDER_INSET,
          )
        : null;
      // Pixels outside `visible` keep an older frame. That is only safe while
      // the size and the hole stay as they were; any change shades it all once.
      const layout = `${width}x${height}|${JSON.stringify(visible)}`;
      const regions = layout === painted && visible ? visible : undefined;
      try {
        renderer.draw(
          { colors: palette.current, style: "liquid", seed: BACKDROP_SEED, grain: BACKDROP_GRAIN },
          width,
          height,
          { time: clock.current, regions },
        );
      } catch {
        setFailed(true);
        return;
      }
      painted = layout;
      if (!shown) {
        shown = true;
        setReady(true);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, renderer, occluderRef]);

  if (!enabled || failed) return null;
  return (
    <div
      ref={boxRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-1000 motion-reduce:transition-none ${
          ready ? "opacity-65" : "opacity-0"
        }`}
      />
      {/* Keeps the pitch readable whatever palette is on: a veil over all of it, darker behind the left column. */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_14%_45%,rgba(7,7,10,0.62),transparent_72%),linear-gradient(rgba(7,7,10,0.3),rgba(7,7,10,0.3))]" />
      {/* On phones the pitch is stacked on top, so the dark goes at the top instead. */}
      <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-[rgba(7,7,10,0.7)] to-transparent md:hidden" />
    </div>
  );
}
