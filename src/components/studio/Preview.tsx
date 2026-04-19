import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStudioStore } from "@/store/useStudioStore";
import { renderGradient } from "@/lib/gradient";
import { DEVICES, DEVICE_SIZES } from "@/lib/palettes";
import { downloadWallpaper } from "@/lib/download";

export function Preview() {
  const { device, colors, style, blur, grain, seed, setDevice, randomize } = useStudioStore(
    useShallow((s) => ({
      device: s.device,
      colors: s.colors,
      style: s.style,
      blur: s.blur,
      grain: s.grain,
      seed: s.seed,
      setDevice: s.setDevice,
      randomize: s.randomize,
    })),
  );

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [downloading, setDownloading] = useState(false);

  useLayoutEffect(() => {
    function layout() {
      const stage = stageRef.current;
      if (!stage) return;
      const availW = stage.clientWidth - 112;
      const availH = stage.clientHeight - 112;
      const d = DEVICE_SIZES[device];
      const ratio = d.w / d.h;
      let w = availW;
      let h = availW / ratio;
      if (h > availH) {
        h = availH;
        w = availH * ratio;
      }
      setSize({ w, h });
    }
    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
  }, [device]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const d = DEVICE_SIZES[device];
    const scale = Math.min(1, 1200 / Math.max(d.w, d.h));
    renderGradient(canvas, {
      w: Math.round(d.w * scale),
      h: Math.round(d.h * scale),
      colors,
      style,
      blur,
      seed,
    });
  }, [device, colors, style, blur, seed]);

  return (
    <div className="relative rounded-[18px] liquid min-h-[560px] overflow-hidden">
      {/* Device pills: centered on mobile, top-left on md+. */}
      <div
        className="absolute top-3.5 z-[3] flex gap-1.5 left-1/2 -translate-x-1/2 md:left-3.5 md:translate-x-0"
        role="tablist"
      >
        {DEVICES.map((d) => {
          const active = device === d;
          return (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`rounded-full px-2.5 md:px-3 py-1.5 text-[10px] md:text-[11px] tracking-[0.1em] uppercase font-sans transition-colors duration-150 backdrop-blur-md ${
                active
                  ? "bg-white text-[#07070a] border border-white"
                  : "bg-black/55 text-white/75 border border-white/14 hover:text-white"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Info badge: top-right on md+, centered below device bar on mobile. */}
      <div className="absolute top-[52px] md:top-3.5 left-1/2 -translate-x-1/2 md:left-auto md:right-3.5 md:translate-x-0 z-[3] rounded-full bg-black/55 border border-white/14 px-2.5 md:px-3 py-1 md:py-1.5 font-sans text-[10px] md:text-[11px] tracking-[0.08em] text-white/75 backdrop-blur-md whitespace-nowrap">
        {DEVICE_SIZES[device].label}
      </div>

      {/* Stage (canvas fitted) */}
      <div
        ref={stageRef}
        className="absolute inset-0 flex items-center justify-center p-14"
        style={{ background: "#000" }}
      >
        <div
          className="relative overflow-hidden rounded-lg transition-[width,height] duration-[400ms]"
          style={{
            width: size.w,
            height: size.h,
            background: "#111",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)",
            transitionTimingFunction: "cubic-bezier(.2,.7,.2,1)",
          }}
        >
          <canvas ref={canvasRef} className="block w-full h-full" />
          <div
            className="absolute inset-0 pointer-events-none wallpaper-grain mix-blend-overlay"
            style={{ opacity: grain / 100 }}
            aria-hidden
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-[3] flex justify-between gap-2.5">
        <button
          onClick={randomize}
          className="inline-flex items-center gap-2 rounded-full bg-black/55 border border-white/14 px-3.5 py-2 text-[11px] tracking-[0.1em] uppercase font-sans text-white/75 backdrop-blur-md transition-colors duration-150 hover:text-white hover:border-white/30"
        >
          ↻ &nbsp;Random
        </button>
        <button
          disabled={downloading}
          onClick={async () => {
            setDownloading(true);
            // Yield to browser so the button repaints before the heavy encode blocks.
            await new Promise((r) => requestAnimationFrame(() => r(null)));
            try {
              await downloadWallpaper({ device, colors, style, blur, grain, seed });
            } finally {
              setDownloading(false);
            }
          }}
          className="inline-flex items-center gap-2 rounded-[2px] bg-[#f8f8f8] text-[#171717] px-3.5 py-2 text-[11px] tracking-[0.1em] uppercase font-sans font-medium transition-colors duration-150 hover:bg-white disabled:opacity-80 disabled:cursor-wait"
        >
          {downloading ? (
            <>
              <span className="inline-block h-3 w-3 rounded-full border-2 border-[#171717] border-t-transparent animate-spin" />
              &nbsp;Generating
            </>
          ) : (
            <>↓ &nbsp;Download</>
          )}
        </button>
      </div>
    </div>
  );
}
