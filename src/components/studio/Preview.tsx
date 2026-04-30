import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { AnimatePresence } from "motion/react";
import { m } from "motion/react";
import { useConfigStore } from "@/store";
import { composeWallpaper } from "@/lib/download/compose";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import { activeColors, DEVICES, DEVICE_SIZES } from "@/lib/palettes";
import { EASE, EASE_CSS } from "@/lib/motion";
import { IPhoneMockup } from "./IPhoneMockup";
import { Framed } from "../ui/Framed";

export function Preview() {
  const { device, colors, active, style, blur, grain, seed, lightAngle, setDevice } = useConfigStore(
    useShallow((s) => ({
      device: s.device,
      colors: s.colors,
      active: s.active,
      style: s.style,
      blur: s.blur,
      grain: s.grain,
      seed: s.seed,
      lightAngle: s.lightAngle,
      setDevice: s.setDevice,
    })),
  );
  // Ramp fed to the renderer — strips the user-deactivated slots (2-4 colors).
  const ramp = activeColors(colors, active);

  const [mockupMode, setMockupMode] = useState(false);
  // Shared canvas rendered once and blitted into both iPhone mockups — avoids
  // rendering the identical gradient twice in mockup mode.
  const [sharedMockupCanvas, setSharedMockupCanvas] = useState<HTMLCanvasElement | null>(null);
  const d = DEVICE_SIZES[device];
  // Mockup only makes sense on the mobile aspect. Force it off if the user
  // switches devices while it's on.
  const showMockup = mockupMode && device === "mobile";

  // Escape closes Mockup mode for accessibility — mirrors how modal UI
  // surfaces are dismissed across iOS / macOS.
  useEffect(() => {
    if (!mockupMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMockupMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mockupMode]);

  // Render the shared mockup wallpaper once per config change. Both iPhone
  // frames then drawImage from this canvas — half the paint work vs each
  // mockup rendering its own gradient. 720×1600 keeps the frame crisp on
  // Retina (iPhone mockups render ~400-500px tall CSS → DPR≤2 → ≤1000 px).
  // Grain is burned into the canvas so the mockup matches what the user
  // will download — no separate SVG overlay.
  useEffect(() => {
    if (!showMockup) return;
    setSharedMockupCanvas(
      composeWallpaper({ w: 720, h: 1600, colors: ramp, style, blur, grain, seed, lightAngle }),
    );
    // `ramp` is derived from `colors` + `active`; track the stable inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMockup, colors, active, style, blur, grain, seed, lightAngle]);

  const canvasRef = useFittedGradientCanvas(
    {
      nativeW: d.w,
      nativeH: d.h,
      colors: ramp,
      style,
      blur,
      grain,
      seed,
      lightAngle,
    },
    [device, colors, active, style, blur, grain, seed, lightAngle],
  );

  return (
    <Framed offset={10} className="rounded-[2px] bg-[#0a0a0d] border border-white/8 min-h-[520px] overflow-hidden">
      {/* Device pills: centered on mobile, top-left on md+. */}
      <div
        className="absolute top-3.5 z-[3] flex gap-1.5 left-1/2 -translate-x-1/2 md:left-3.5 md:translate-x-0"
        role="tablist"
      >
        {DEVICES.map((dev) => {
          const active = device === dev;
          return (
            <button
              key={dev}
              onClick={() => setDevice(dev)}
              className={`rounded-full px-2.5 md:px-3 py-1.5 text-[10px] md:text-[11px] tracking-[0.1em] uppercase font-sans transition-colors duration-150 backdrop-blur-md ${
                active
                  ? "bg-white text-[#07070a] border border-white"
                  : "bg-black/55 text-white/75 border border-white/14 hover:text-white"
              }`}
            >
              {dev}
            </button>
          );
        })}
        {device === "mobile" && (
          <button
            onClick={() => setMockupMode((v) => !v)}
            aria-pressed={mockupMode}
            title="Preview inside an iPhone frame (lock + home)"
            className={`ml-1 rounded-full px-2.5 md:px-3 py-1.5 text-[10px] md:text-[11px] tracking-[0.1em] uppercase font-sans transition-colors duration-150 backdrop-blur-md ${
              mockupMode
                ? "bg-white text-[#07070a] border border-white"
                : "bg-black/55 text-white/75 border border-white/14 hover:text-white"
            }`}
          >
            Mockup
          </button>
        )}
      </div>

      {/* Info badge: top-right on md+, centered below device bar on mobile. */}
      <div className="absolute top-[52px] md:top-3.5 left-1/2 -translate-x-1/2 md:left-auto md:right-3.5 md:translate-x-0 z-[3] rounded-full bg-black/55 border border-white/14 px-2.5 md:px-3 py-1 md:py-1.5 font-sans text-[10px] md:text-[11px] tracking-[0.08em] text-white/75 backdrop-blur-md whitespace-nowrap">
        {DEVICE_SIZES[device].label}
      </div>

      {/* Stage — either the fit-to-aspect wallpaper or the dual-iPhone mockup.
          AnimatePresence cross-fades between the two modes when toggled.
          Mobile gets a smaller padding + tighter gap so the two phones fit
          without being clipped horizontally. Each phone is slotted into a
          flex-1 cell and constrained to max-w to scale down gracefully. */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 md:p-14"
        style={{ background: "radial-gradient(circle at 50% 50%, #0c0c10, #070709)" }}
      >
        <AnimatePresence mode="wait">
          {showMockup ? (
            <m.div
              key="mockup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
              // pt-20 on mobile clears the device pills + info badge
              // (pills row ~40px + badge 24px + 16px breathing room). Desktop
              // keeps pt-0 because pills are top-left and don't overlap the
              // horizontally-centered iPhones.
              className="flex items-stretch justify-center gap-3 md:gap-6 h-full w-full max-w-full pt-20 md:pt-0"
            >
              <m.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
                className="flex-1 flex items-center justify-center min-w-0 min-h-0"
              >
                <IPhoneMockup variant="lock" grain={grain} source={sharedMockupCanvas} />
              </m.div>
              <m.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.18 }}
                className="flex-1 flex items-center justify-center min-w-0 min-h-0"
              >
                <IPhoneMockup variant="home" grain={grain} source={sharedMockupCanvas} />
              </m.div>
            </m.div>
          ) : (
            <m.div
              key="fit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="relative overflow-hidden rounded-lg transition-[aspect-ratio] duration-[400ms]"
              style={{
                aspectRatio: `${d.w} / ${d.h}`,
                maxWidth: "100%",
                maxHeight: "100%",
                background: "#111",
                boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)",
                transitionTimingFunction: EASE_CSS,
              }}
            >
              <canvas ref={canvasRef} className="block w-full h-full" />
            </m.div>
          )}
        </AnimatePresence>
      </div>

    </Framed>
  );
}
