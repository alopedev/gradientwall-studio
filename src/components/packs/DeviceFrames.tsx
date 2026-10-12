import type { CSSProperties, ReactNode } from "react";

/**
 * Pure-CSS device bezels used to show wallpapers the way buyers will see them.
 * Everything is sized in percentages of the frame (never px), so one frame
 * scales from a 64px thumbnail to the full stage without distorting.
 */

const BEZEL =
  "bg-[linear-gradient(160deg,#2a2a30,#151519_55%,#1d1d22)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_0_0_1px_#050506]";

interface FrameProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Phone bezel at the 1290:2796 aspect of a modern iPhone, with a dynamic island. */
export function PhoneFrame({ children, className = "", style }: FrameProps) {
  return (
    <div
      data-device="phone"
      className={`${/\babsolute\b/.test(className) ? "" : "relative"} aspect-[1290/2796] rounded-[15%/7%] ${BEZEL} ${className}`}
      style={style}
    >
      {/* Inset, not padding: a padding % follows the parent's width, so the bezel would grow with the page. */}
      <div className="absolute inset-x-[2.5%] inset-y-[1.15%] overflow-hidden rounded-[13%/6%] bg-black">
        {children}
        <span
          aria-hidden
          className="absolute left-1/2 top-[2%] z-10 h-[3.3%] w-[30%] -translate-x-1/2 rounded-full bg-black"
        />
      </div>
    </div>
  );
}

/** Laptop: lid with the screen on top, a thin base below. Width-driven; height follows. */
export function LaptopFrame({ children, className = "", style }: FrameProps) {
  return (
    <div data-device="laptop" className={className} style={style}>
      <div className={`aspect-[16/10] rounded-t-[2.2%/3.5%] rounded-b-[0.6%] p-[2.2%] ${BEZEL}`}>
        <div className="relative h-full w-full overflow-hidden rounded-[0.8%] bg-black">
          {children}
        </div>
      </div>
      <div
        aria-hidden
        className="-mx-[6%] h-[1.6%] min-h-[5px] rounded-b-[12px] rounded-t-[2px] bg-[linear-gradient(180deg,#3a3a42,#17171b)] shadow-[0_20px_30px_-10px_rgba(0,0,0,0.8)]"
      />
    </div>
  );
}

/** The time on top of the phone render, so the wallpaper reads as a lock screen. */
export function LockScreen() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <div
      aria-hidden
      className="@container pointer-events-none absolute inset-x-0 top-[10%] z-10 text-center font-sans text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.3)]"
    >
      <div className="text-[5.2cqi] font-medium">{today.replace(",", "")}</div>
      <div className="text-[24cqi] font-bold leading-none tracking-[-0.03em]">9:41</div>
    </div>
  );
}
