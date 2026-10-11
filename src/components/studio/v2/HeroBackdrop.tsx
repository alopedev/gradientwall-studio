import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  BACKDROP_GRAIN,
  BACKDROP_MIN_FRAME_MS,
  BACKDROP_SEED,
  backdropSize,
  createRendererV2,
  isWebGL2Supported,
  shouldRunBackdrop,
  stepPalette,
  type V2Renderer,
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

/**
 * The v2 shader moving slowly behind the first screen, tinted with the current
 * palette. A Shuffle eases its colours to the new ones. It sits on top of
 * `HeroAmbient`, which stays as the instant, free layer underneath: with no
 * WebGL2, with reduced motion or data saver, or if the GPU path fails, this
 * renders nothing and the ambient is all there is.
 *
 * It owns its own small WebGL context (a fraction of the screen size, about
 * 30 fps) and only draws while it is on screen and the tab is visible.
 */
export function HeroBackdrop() {
  const [enabled] = useState(() => shouldRunBackdrop(readEnv()));
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);

  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<V2Renderer | null>(null);
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

  // One renderer for the life of the component.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    try {
      rendererRef.current = createRendererV2(canvas, { animated: true });
    } catch {
      setFailed(true);
    }
    return () => {
      rendererRef.current = null;
    };
  }, [enabled]);

  const active = enabled && !failed && inView && !hidden;
  useEffect(() => {
    const renderer = rendererRef.current;
    const box = boxRef.current;
    if (!active || !renderer || !box) return;

    let raf = 0;
    let last: number | null = null;
    const frame = (now: number) => {
      if (last !== null && now - last < BACKDROP_MIN_FRAME_MS) {
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
      try {
        renderer.draw(
          { colors: palette.current, style: "liquid", seed: BACKDROP_SEED, grain: BACKDROP_GRAIN },
          width,
          height,
          { time: clock.current },
        );
      } catch {
        setFailed(true);
        return;
      }
      setReady(true);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);

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
