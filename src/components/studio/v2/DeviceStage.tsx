import { Camera, Flashlight } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { type DragEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import { extractColorsFromFile } from "@/lib/color-extract";
import type { Device } from "@/lib/palettes";
import { useConfigStore, useRenderParams } from "@/store";
import { useWallpaperEngine } from "../engine";
import { PrintSweep } from "./PrintSweep";
import { REVEAL_TTL_MS, RevealContext, revealDurationMs } from "./reveal";
import { ScreenMotion } from "./ScreenMotion";

/** Bezel padding and corner radius of each frame, in px. */
const FRAME: Record<Device, { pad: number; radius: number }> = {
  // The phone's radius comes from its width (see frameCorners).
  mobile: { pad: 7, radius: 0 },
  tablet: { pad: 10, radius: 30 },
  desktop: { pad: 7, radius: 14 },
};

/** Height reserved under a monitor for its stand. */
const STAND_H = 46;

/** Screen size as CSS, fitted inside the stage box (container query units). */
export function screenSize(device: Device): { width: string; height: string } {
  const { pad } = FRAME[device];
  const w = `(100cqw - ${pad * 2}px)`;
  if (device === "desktop") {
    // Leave room for the monitor stand under the screen.
    const h = `(100cqh - ${pad * 2 + STAND_H}px)`;
    const width = `min(${w}, ${h} * 16 / 9)`;
    return { width: `calc(${width})`, height: `calc(${width} * 9 / 16)` };
  }
  const [rw, rh] = device === "mobile" ? [9, 20] : [3, 4];
  const h = `(100cqh - ${pad * 2}px)`;
  const height = `min(${h}, ${w} * ${rh} / ${rw})`;
  return { width: `calc(${height} * ${rw} / ${rh})`, height: `calc(${height})` };
}

/** iPhone 16 Pro screen corner: 62 pt on a 402 pt wide screen. */
const PHONE_CORNER = 0.154;

/**
 * Corner radius of the frame and of the screen, as CSS. The phone's corners
 * scale with its width (a fixed radius turns a small phone into a pill); the
 * frame adds the bezel so both curves stay concentric.
 */
export function frameCorners(device: Device): { frame: string; screen: string } {
  const { pad, radius } = FRAME[device];
  if (device === "mobile") {
    const { width } = screenSize(device);
    return {
      frame: `calc(${width} * ${PHONE_CORNER} + ${pad}px)`,
      screen: `calc(${width} * ${PHONE_CORNER})`,
    };
  }
  return { frame: `${radius}px`, screen: `${radius - pad}px` };
}

/**
 * The wallpaper inside a phone, tablet or monitor frame. Switching device
 * morphs the frame; a change started from a button reveals the new frame as a
 * circle growing out of that button.
 */
export function DeviceStage() {
  const engine = useWallpaperEngine();
  const device = useConfigStore((s) => s.device);
  const params = useRenderParams();
  const revealRef = useContext(RevealContext);
  const frame = FRAME[device];
  const size = screenSize(device);
  const corners = frameCorners(device);

  const screenRef = useRef<HTMLDivElement>(null);
  const underRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<Animation | null>(null);
  const lastRevealAt = useRef<number | null>(null);

  const endReveal = useCallback((live?: HTMLCanvasElement | null) => {
    animRef.current?.cancel();
    animRef.current = null;
    live?.classList.remove("gws-reveal");
    if (underRef.current) underRef.current.style.opacity = "0";
  }, []);

  // Runs just before the live canvas is repainted: keep the old frame
  // underneath and let the new one grow over it.
  const onBeforePaint = useCallback(
    (live: HTMLCanvasElement) => {
      const req = revealRef?.current;
      if (revealRef) revealRef.current = null;
      const under = underRef.current;
      const screen = screenRef.current;
      if (!req || !under || !screen) return;
      if (performance.now() - req.at > REVEAL_TTL_MS) return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      if (live.width === 0 || live.height === 0) return;

      endReveal(live);
      under.width = live.width;
      under.height = live.height;
      under.getContext("2d")?.drawImage(live, 0, 0);
      under.style.filter = live.style.filter;
      under.style.opacity = "1";

      const box = screen.getBoundingClientRect();
      const ox = req.x - box.left;
      const oy = req.y - box.top;
      const reach = Math.hypot(Math.max(ox, box.width - ox), Math.max(oy, box.height - oy)) + 48;
      live.style.setProperty("--ox", `${ox}px`);
      live.style.setProperty("--oy", `${oy}px`);
      live.style.setProperty("--r", "0px");
      live.classList.add("gws-reveal");
      // The hook paints right after this callback; start on the next frame so
      // the first frame of the animation already shows the new bitmap.
      requestAnimationFrame(() => {
        if (!live.classList.contains("gws-reveal")) return;
        const now = performance.now();
        const since = lastRevealAt.current === null ? null : now - lastRevealAt.current;
        lastRevealAt.current = now;
        const anim = live.animate([{ "--r": "0px" }, { "--r": `${reach}px` }], {
          duration: revealDurationMs(since),
          easing: "cubic-bezier(.2,.7,.2,1)",
        });
        animRef.current = anim;
        anim.onfinish = () => endReveal(live);
        anim.oncancel = () => undefined;
      });
    },
    [endReveal, revealRef],
  );

  useEffect(() => () => animRef.current?.cancel(), []);

  // Drop a photo on the screen and its dominant colors become the palette.
  const [dropping, setDropping] = useState(false);
  const onDragOver = (e: DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropping(true);
  };
  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDropping(false);
    const file = e.dataTransfer.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    try {
      useConfigStore.getState().setColors(await extractColorsFromFile(file));
    } catch {
      // Same silent posture as the "Use my photo" popover.
    }
  };

  return (
    <m.div
      layout
      transition={{ type: "spring", stiffness: 170, damping: 24 }}
      style={{
        padding: frame.pad,
        borderRadius: corners.frame,
        marginBottom: device === "desktop" ? STAND_H : 0,
      }}
      className={`relative bg-gradient-to-br from-[#2a2a30] via-[#151519] to-[#1d1d22] ${
        device === "mobile"
          ? // iPhone: a thin titanium band around a black bezel.
            "bg-none bg-[#08080a] shadow-[inset_0_0_0_1.5px_#8a8a90,inset_0_0_0_3px_#2a2a2e,0_50px_100px_-30px_rgba(0,0,0,0.85),0_20px_40px_-20px_rgba(0,0,0,0.6)]"
          : "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_0_0_1px_#050506,0_50px_100px_-30px_rgba(0,0,0,0.85),0_20px_40px_-20px_rgba(0,0,0,0.6)]"
      }`}
    >
      {device === "mobile" && <SideButtons />}
      <m.div
        layout
        ref={screenRef}
        role="img"
        aria-label={`Wallpaper preview on a ${device === "desktop" ? "monitor" : device === "tablet" ? "tablet" : "phone"}`}
        onDragOver={onDragOver}
        onDragLeave={() => setDropping(false)}
        onDrop={onDrop}
        transition={{ type: "spring", stiffness: 170, damping: 24 }}
        style={{ ...size, borderRadius: corners.screen }}
        className="relative translate-z-0 overflow-hidden bg-black [container-type:size]"
      >
        <canvas
          ref={underRef}
          aria-hidden
          className="absolute inset-0 z-[1] size-full object-cover opacity-0"
        />
        <engine.Canvas
          params={params}
          device={device}
          onBeforePaint={onBeforePaint}
          className="absolute inset-0 z-[2] size-full object-cover"
        />
        <ScreenMotion params={params} />
        <LockOverlay device={device} />
        <PrintSweep />
        {dropping && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[inherit] border-2 border-dashed border-white/70 bg-black/40 font-sans text-sm text-white backdrop-blur-sm">
            Drop a photo to use its colors
          </div>
        )}
      </m.div>
      <AnimatePresence>
        {device === "desktop" && (
          <m.div
            aria-hidden
            initial={{ opacity: 0, scaleY: 0.6, y: -14 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.6, y: -14, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.15 }}
            style={{ transformOrigin: "top" }}
            className="absolute left-1/2 top-full grid -translate-x-1/2 justify-items-center"
          >
            <i
              className="block h-9 w-[74px] bg-gradient-to-b from-[#0e0e11] via-[#26262c] to-[#1b1b20]"
              style={{ clipPath: "polygon(14% 0, 86% 0, 100% 100%, 0 100%)" }}
            />
            <i className="block h-2 w-[190px] rounded-[3px_3px_6px_6px] bg-gradient-to-b from-[#34343b] to-[#1a1a1e] shadow-[0_14px_30px_rgba(0,0,0,0.6)]" />
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

/** Fake lock screen (phone, tablet) or menu bar (monitor) drawn over the wallpaper. */
function LockOverlay({ device }: { device: Device }) {
  // Filled after mount so server-rendered and prerendered HTML never bakes in a date.
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(
      new Intl.DateTimeFormat("en-GB", { weekday: "long", month: "long", day: "numeric" }).format(
        new Date(),
      ),
    );
  }, []);
  const shortDate = date ? date.replace(/^(\w{3})\w*,\s(\w{3})\w*/, "$1 $2") : "";

  if (device === "desktop") {
    return (
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-[5] flex h-[max(12px,3.4cqh)] items-center justify-between bg-black/[0.18] px-[1.4cqw] text-[max(8px,1.15cqw)] font-medium text-white/90 backdrop-blur-[10px]"
      >
        <i className="block size-[1.1cqw] min-h-1.5 min-w-1.5 rounded-full bg-white/90" />
        <span className="whitespace-nowrap">{shortDate} 9:41</span>
      </div>
    );
  }
  const phone = device === "mobile";
  return (
    <>
      <div
        className="absolute left-1/2 top-[2.6cqh] z-[6] h-[3.9cqh] w-[30cqw] -translate-x-1/2 rounded-full bg-black"
        aria-hidden
      />
      {phone && (
        <div
          aria-hidden
          data-part="status-bar"
          className="absolute right-[7cqw] top-[3.7cqh] z-[6] flex items-center gap-[1.4cqw]"
        >
          <i
            className="block h-[2.8cqw] w-[4.4cqw] bg-white"
            style={{
              clipPath: "polygon(0 75%, 100% 0, 100% 100%, 0 100%)",
              maskImage:
                "linear-gradient(90deg, #000 0 18%, transparent 18% 27%, #000 27% 45%, transparent 45% 55%, #000 55% 73%, transparent 73% 82%, #000 82%)",
            }}
          />
          <i className="block h-[3cqw] w-[6.2cqw] rounded-[1cqw] bg-white/95" />
        </div>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] grid content-start justify-items-center pt-[12.5cqh] text-white/95 [text-shadow:0_1px_18px_rgba(0,0,0,0.25)]"
      >
        <span className="whitespace-nowrap text-[max(9px,4.6cqw)] font-semibold tracking-[0.01em]">
          {date}
        </span>
        <span className="mt-[0.5cqh] text-[23cqw] font-bold leading-none tracking-[-0.04em] tabular-nums">
          9:41
        </span>
        {phone && (
          <>
            <QuickAction side="left">
              <Flashlight className="size-[5cqw]" strokeWidth={2.2} />
            </QuickAction>
            <QuickAction side="right">
              <Camera className="size-[5cqw]" strokeWidth={2.2} />
            </QuickAction>
          </>
        )}
        <span className="absolute bottom-[1.4cqh] left-1/2 h-[max(3px,0.55cqh)] w-[36cqw] -translate-x-1/2 rounded-[9px] bg-white/85" />
      </div>
    </>
  );
}

/** Flashlight and camera buttons at the bottom corners of the iPhone lock screen. */
function QuickAction({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return (
    <span
      data-part="quick-action"
      className={`absolute bottom-[3cqh] grid size-[11.5cqw] place-items-center rounded-full bg-[rgba(30,30,34,0.38)] backdrop-blur-[10px] ${side === "left" ? "left-[9cqw]" : "right-[9cqw]"}`}
    >
      {children}
    </span>
  );
}

/** Action button, volume up and down on the left edge of the iPhone, side button on the right. */
function SideButtons() {
  const part = "absolute w-[3px] rounded-[2px] bg-gradient-to-r";
  return (
    <>
      <i
        data-part="side-button"
        aria-hidden
        className={`${part} -left-[2px] top-[16%] h-[4.5%] from-[#3a3a3f] to-[#6c6c72]`}
      />
      <i
        data-part="side-button"
        aria-hidden
        className={`${part} -left-[2px] top-[23.5%] h-[8%] from-[#3a3a3f] to-[#6c6c72]`}
      />
      <i
        data-part="side-button"
        aria-hidden
        className={`${part} -left-[2px] top-[33%] h-[8%] from-[#3a3a3f] to-[#6c6c72]`}
      />
      <i
        data-part="side-button"
        aria-hidden
        className={`${part} -right-[2px] top-[26%] h-[12%] from-[#6c6c72] to-[#3a3a3f]`}
      />
    </>
  );
}
