import {
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { m } from "motion/react";
import { useConfigStore, useRenderParams } from "@/store";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import { extractColorsFromFile } from "@/lib/color-extract";
import { DEVICES, DEVICE_SIZES } from "@/lib/palettes";
import { EASE } from "@/lib/motion";
import { Framed } from "../ui/Framed";

const clamp = (n: number, min: number, max: number) => (n < min ? min : n > max ? max : n);

/**
 * `framed` controla el chrome envolvente: corners + border + bg + min-height
 * que enmarcan el canvas como una "tarjeta". `true` (default) preserva el
 * look del Studio v1. `false` lo monta sin marco — usado por el shell v2,
 * donde el canvas respira sin la tarjeta y el lenguaje visual se acerca al
 * editorial brutalist sin chrome editorial.
 */
interface PreviewProps {
  framed?: boolean;
}

export function Preview({ framed = true }: PreviewProps = {}) {
  const device = useConfigStore((s) => s.device);
  const setDevice = useConfigStore((s) => s.setDevice);
  const reshuffle = useConfigStore((s) => s.reshuffle);
  const setBlur = useConfigStore((s) => s.setBlur);
  const setLightAngle = useConfigStore((s) => s.setLightAngle);
  const setDensity = useConfigStore((s) => s.setDensity);
  const setColors = useConfigStore((s) => s.setColors);
  const params = useRenderParams();
  const [dragActive, setDragActive] = useState(false);
  const d = DEVICE_SIZES[device];

  // Cross-fade overlay: a sibling canvas that holds the snapshot of the
  // previous frame and fades from opacity 1 → 0 each time the live canvas
  // is about to repaint. See ADR-0003 ("anticipation > reveal"): the brief
  // overlap of old + new gives the reveal a body that an instant repaint
  // does not. Respects prefers-reduced-motion → instant disappearance.
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const canvasRef = useFittedGradientCanvas(
    {
      nativeW: d.w,
      nativeH: d.h,
      ...params,
      beforePaint: (live) => {
        const overlay = overlayCanvasRef.current;
        if (!overlay || live.width === 0 || live.height === 0) return;
        if (overlay.width !== live.width) overlay.width = live.width;
        if (overlay.height !== live.height) overlay.height = live.height;
        const ctx = overlay.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.drawImage(live, 0, 0);

        const reduced =
          typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

        overlay.style.transition = "none";
        overlay.style.opacity = reduced ? "0" : "1";
        if (!reduced) {
          // Double rAF so the browser commits opacity:1 before the
          // transition kicks in — otherwise the change is coalesced and
          // the fade is skipped.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (!overlayCanvasRef.current) return;
              overlayCanvasRef.current.style.transition =
                "opacity 700ms cubic-bezier(0.22, 1, 0.36, 1)";
              overlayCanvasRef.current.style.opacity = "0";
            });
          });
        }
      },
    },
    [device, params],
  );

  // Direct manipulation on the preview canvas. Holding Alt enables three
  // gestures so power users can sculpt without leaving the canvas:
  //   Alt + wheel     → blur (smaller wheel = -1, bigger = +1)
  //   Alt + drag X    → light angle
  //   Alt + drag Y    → density
  // Double-click reshuffles the seed regardless of modifier — it's a clearly
  // discoverable "give me a different one of the same thing" gesture.
  const dragRef = useRef<{
    startX: number;
    startY: number;
    baseLight: number;
    baseDensity: number;
  } | null>(null);
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

  // El cuerpo es idéntico en ambas variantes; sólo cambia el wrapper visual:
  // v1 (framed=true) → Framed con corners + border + bg como una "tarjeta".
  // v2 (framed=false) → div plano: el canvas respira sin chrome envolvente.
  const body = (
    <>
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
      </div>

      {/* Resolution badge — centered on small screens, right-aligned on md+. */}
      <div className="absolute top-[52px] md:top-3.5 left-1/2 -translate-x-1/2 md:left-auto md:right-3.5 md:translate-x-0 z-[3] flex items-center gap-1.5">
        <div className="rounded-full bg-black/55 border border-white/14 px-2.5 md:px-3 py-1 md:py-1.5 font-sans text-[10px] md:text-[11px] tracking-[0.08em] text-white/75 backdrop-blur-md whitespace-nowrap">
          {DEVICE_SIZES[device].label}
        </div>
      </div>

      {/* Stage — fit-to-aspect wallpaper. The stage declares
          `container-type: size` so the wallpaper can sit in container-query
          coordinates: width = min(stage-inline, stage-block × aspect). Without
          an explicit width the wallpaper would collapse to the canvas's
          intrinsic 300×150 — which is why the desktop preview previously
          looked smaller than iPad. */}
      <div
        className="absolute inset-0 flex items-center justify-center p-3 md:p-6 [container-type:size]"
        style={{ background: "radial-gradient(circle at 50% 50%, #0c0c10, #070709)" }}
      >
        <m.div
          key="fit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="relative overflow-hidden rounded-lg [&[data-alt=true]]:cursor-grab [&[data-alt=true]:active]:cursor-grabbing"
          style={{
            aspectRatio: `${d.w} / ${d.h}`,
            // Take the largest box that fits both axes: the lesser of the
            // stage's inline size and (stage block size × aspect ratio).
            // Height is derived from aspect-ratio.
            width: `min(100cqi, calc(100cqb * ${d.w} / ${d.h}))`,
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
          {/* Cross-fade overlay — holds the snapshot of the previous frame.
              opacity starts at 0; beforePaint snapshots into it, pops to 1,
              then transitions back to 0. pointer-events:none so it never
              steals the drag/drop or alt-drag gestures on the live canvas. */}
          <canvas
            ref={overlayCanvasRef}
            aria-hidden
            className="absolute inset-0 block w-full h-full pointer-events-none"
            style={{ opacity: 0 }}
          />
        </m.div>
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
    </>
  );

  if (framed) {
    return (
      <Framed
        offset={10}
        className="rounded-[2px] bg-[#0a0a0d] border border-white/8 min-h-[420px] overflow-hidden"
        onDragOver={onPreviewDragOver}
        onDragLeave={onPreviewDragLeave}
        onDrop={onPreviewDrop}
      >
        {body}
      </Framed>
    );
  }

  return (
    <div
      className="relative min-h-[420px] overflow-hidden"
      onDragOver={onPreviewDragOver}
      onDragLeave={onPreviewDragLeave}
      onDrop={onPreviewDrop}
    >
      {body}
    </div>
  );
}
