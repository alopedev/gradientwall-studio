import { useEffect, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { AnimatePresence } from "motion/react";
import { m } from "motion/react";
import { useConfigStore, useRenderParams } from "@/store";
import { composeWallpaper } from "@/lib/download/compose";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import { extractColorsFromFile } from "@/lib/color-extract";
import { DEVICES, DEVICE_SIZES } from "@/lib/palettes";
import { EASE } from "@/lib/motion";
import { IPhoneMockup } from "./IPhoneMockup";
import { Framed } from "../ui/Framed";

const clamp = (n: number, min: number, max: number) => (n < min ? min : n > max ? max : n);

export function Preview() {
  const device = useConfigStore((s) => s.device);
  const setDevice = useConfigStore((s) => s.setDevice);
  const reshuffle = useConfigStore((s) => s.reshuffle);
  const setBlur = useConfigStore((s) => s.setBlur);
  const setLightAngle = useConfigStore((s) => s.setLightAngle);
  const setDensity = useConfigStore((s) => s.setDensity);
  const setColors = useConfigStore((s) => s.setColors);
  const params = useRenderParams();
  const [dragActive, setDragActive] = useState(false);
  // `grain` reaches the mockup as a CSS overlay below — the renderer's
  // bitmap grain is already burned in via composeWallpaper.
  const grain = params.grain ?? 0;

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
    setSharedMockupCanvas(composeWallpaper({ w: 720, h: 1600, ...params }));
  }, [showMockup, params]);

  const canvasRef = useFittedGradientCanvas(
    { nativeW: d.w, nativeH: d.h, ...params },
    [device, params],
  );

  // Direct manipulation on the preview canvas. Holding Alt enables three
  // gestures so power users can sculpt without leaving the canvas:
  //   Alt + wheel     → blur (smaller wheel = -1, bigger = +1)
  //   Alt + drag X    → light angle
  //   Alt + drag Y    → density
  // Double-click reshuffles the seed regardless of modifier — it's a clearly
  // discoverable "give me a different one of the same thing" gesture.
  const dragRef = useRef<{ startX: number; startY: number; baseLight: number; baseDensity: number } | null>(null);
  const onCanvasWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (!e.altKey) return;
    e.preventDefault();
    const cur = useConfigStore.getState().blur;
    const step = e.deltaY > 0 ? -2 : 2;
    setBlur(clamp(cur + step, 0, 200));
  };
  const onCanvasPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.altKey) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const s = useConfigStore.getState();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseLight: s.lightAngle,
      baseDensity: s.density,
    };
  };
  const onCanvasPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setLightAngle(d.baseLight + dx * 0.5);
    setDensity(clamp(d.baseDensity - dy * 0.0035, 0, 1));
  };
  const onCanvasPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };
  const onCanvasDoubleClick = () => reshuffle();

  // Drop an image anywhere on the preview frame and the dominant colors land
  // in the palette — the same path as the "Use my photo" button, but no
  // popover, no clicks. Counts as discoverable: the dashed-overlay state
  // makes the affordance obvious during drag.
  const onPreviewDragOver = (e: ReactDragEvent<HTMLDivElement>) => {
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!dragActive) setDragActive(true);
  };
  const onPreviewDragLeave = (e: ReactDragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) setDragActive(false);
  };
  const onPreviewDrop = async (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const colors = await extractColorsFromFile(file);
      setColors(colors);
    } catch {
      // silent — same posture as the popover path
    }
  };

  return (
    <Framed
      offset={10}
      className="rounded-[2px] bg-[#0a0a0d] border border-white/8 min-h-[520px] overflow-hidden"
      onDragOver={onPreviewDragOver}
      onDragLeave={onPreviewDragLeave}
      onDrop={onPreviewDrop}
    >
      {/* Device pills: centered on mobile, top-left on md+. Strictly aspect
          ratio choice — Mockup lives separately as a viewing-mode toggle. */}
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
      </div>

      {/* Top-right cluster: resolution badge + iPhone-view toggle (mobile
          aspect only). Centered on small screens, right-aligned on md+. The
          toggle is intentionally a different shape from the device pills — a
          dot-prefixed pill — so it doesn't read as another aspect-ratio
          option, only as a viewing mode for the current mobile aspect. */}
      <div className="absolute top-[52px] md:top-3.5 left-1/2 -translate-x-1/2 md:left-auto md:right-3.5 md:translate-x-0 z-[3] flex items-center gap-1.5">
        <div className="rounded-full bg-black/55 border border-white/14 px-2.5 md:px-3 py-1 md:py-1.5 font-sans text-[10px] md:text-[11px] tracking-[0.08em] text-white/75 backdrop-blur-md whitespace-nowrap">
          {DEVICE_SIZES[device].label}
        </div>
        {device === "mobile" && <IPhoneViewToggle on={mockupMode} onToggle={() => setMockupMode((v) => !v)} />}
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
              // pt-20 on mobile clears the device pills + info badge.
              // Desktop keeps pt-0 because pills are top-left and don't
              // overlap the centered photo.
              className="flex items-center justify-center h-full w-full max-w-full pt-20 md:pt-0"
            >
              <IPhoneMockup grain={grain} source={sharedMockupCanvas} />
            </m.div>
          ) : (
            <m.div
              key="fit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="relative overflow-hidden rounded-lg [&[data-alt=true]]:cursor-grab [&[data-alt=true]:active]:cursor-grabbing"
              style={{
                aspectRatio: `${d.w} / ${d.h}`,
                maxWidth: "100%",
                maxHeight: "100%",
                background: "#111",
                boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)",
              }}
              onWheel={onCanvasWheel}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerCancel={onCanvasPointerUp}
              onDoubleClick={onCanvasDoubleClick}
              title="Alt + scroll: blur · Alt + drag: light/density · double-click: reshuffle"
            >
              <canvas
                ref={canvasRef}
                className="block w-full h-full motion-safe:animate-[gw-breathe_9s_ease-in-out_infinite]"
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drag-and-drop affordance: dashed inset overlay surfaces while the
          user is dragging an image file over the frame. Drop extracts the
          dominant colors via k-means and seeds the swatches — same path as
          "Use my photo", zero clicks. pointer-events:none so it doesn't
          intercept the drop event itself. */}
      {dragActive && (
        <div
          aria-hidden
          className="absolute inset-2 z-[6] pointer-events-none rounded-[2px] border-2 border-dashed border-white/55 bg-black/35 backdrop-blur-[2px] flex items-center justify-center"
        >
          <span className="font-sans text-[12px] tracking-[0.2em] uppercase text-white/85">
            Drop to extract palette
          </span>
        </div>
      )}
    </Framed>
  );
}

/**
 * Pill toggle for switching the Preview into the iPhone-mockup mode. Sits in
 * the top-right cluster next to the resolution badge — visually distinct
 * from the device pills (dot-prefixed, translucent) so it doesn't read as
 * another aspect-ratio option.
 */
function IPhoneViewToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const pillCls = on
    ? "bg-white/12 text-white border-white/35"
    : "bg-black/55 text-white/65 border-white/14 hover:text-white hover:border-white/25";
  const dotCls = on ? "bg-white shadow-[0_0_4px_rgba(255,255,255,0.55)]" : "bg-white/30";
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      aria-label="Preview inside iPhone frame"
      title="Preview inside an iPhone frame (lock + home)"
      className={`inline-flex items-center gap-1.5 rounded-full backdrop-blur-md px-2.5 md:px-3 py-1 md:py-1.5 transition-[color,background-color,border-color] duration-150 font-sans text-[10px] md:text-[11px] tracking-[0.1em] uppercase border ${pillCls}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full transition-colors duration-150 ${dotCls}`} />
      iPhone view
    </button>
  );
}
