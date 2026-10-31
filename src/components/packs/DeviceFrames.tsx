import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { HERO_PHONE_IMAGE } from "@/lib/seo/pages";

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

interface PhoneProps extends FrameProps {
  /** Marks the phone for a page transition (see lib/page-transition). */
  "data-vt"?: string;
  "data-vt-src"?: string;
}

/** Phone bezel at the 1290:2796 aspect of a modern iPhone, with a dynamic island. */
export function PhoneFrame({ children, className = "", style, ...marks }: PhoneProps) {
  return (
    <div
      {...marks}
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

/**
 * The hero's cut-out phone photo (599 × 1283, transparent screen) with the
 * wallpaper behind its screen hole: a real phone, for the pack page's stage.
 * The screen box is measured on that photo, like the hero's.
 */
export function PhotoPhoneFrame({ children, className = "", style, ...marks }: PhoneProps) {
  return (
    <div
      {...marks}
      data-device="phone"
      className={`${/\babsolute\b/.test(className) ? "" : "relative"} ${className}`}
      style={style}
    >
      <div className="absolute inset-x-[4.34%] inset-y-[1.71%] overflow-hidden rounded-[13.5%/6%] bg-black">
        {children}
      </div>
      <img
        src={HERO_PHONE_IMAGE}
        alt=""
        width={599}
        height={1283}
        loading="eager"
        className="relative block h-auto w-full select-none"
        draggable={false}
      />
    </div>
  );
}

/**
 * Laptop: a black-glass lid with a camera notch on top of an aluminium base
 * with its opening lip. Width-driven; height follows.
 */
export function LaptopFrame({ children, className = "", style }: FrameProps) {
  return (
    <div data-device="laptop" className={className} style={style}>
      <div className="relative aspect-[16/10.4] rounded-t-[clamp(8px,1.6vw,22px)] rounded-b-[4px] bg-[#0c0c0e] px-[1.8%] pt-[1.8%] pb-[2.8%] shadow-[0_0_0_2px_#b9bbbf]">
        <div className="relative h-full w-full overflow-hidden rounded-[1%] bg-black">
          {children}
        </div>
        <span
          aria-hidden
          className="absolute left-1/2 top-[1.8%] h-[2.4%] w-[9%] -translate-x-1/2 rounded-b-[6px] bg-[#0c0c0e]"
        />
      </div>
      <div
        aria-hidden
        className="relative -mx-[6.5%] h-[1.9%] min-h-[6px] rounded-b-[18px] rounded-t-[2px] bg-[linear-gradient(180deg,#e2e3e5,#a9abaf)] shadow-[0_24px_30px_-12px_rgba(0,0,0,0.45)]"
      >
        <span className="absolute left-1/2 top-0 h-[45%] w-[14%] -translate-x-1/2 rounded-b-[8px] bg-[#8e9095]" />
      </div>
    </div>
  );
}

/** The time on top of the phone render, so the wallpaper reads as a lock screen. */
export function LockScreen() {
  // Filled after mount, like the Studio's lock screen: the prerendered HTML
  // never bakes in the day it was built.
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    );
  }, []);
  return (
    <div
      aria-hidden
      className="@container pointer-events-none absolute inset-x-0 top-[10%] z-10 text-center font-sans text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.3)]"
    >
      {/* Drawn with CSS `content`, not as text: this sits inside the pack card's
          link, and crawlers would read the date and time as its anchor text. */}
      <div
        data-text={today.replace(",", "")}
        className="text-[5.2cqi] font-medium before:content-[attr(data-text)]"
      />
      <div
        data-text="9:41"
        className="text-[24cqi] font-bold leading-none tracking-[-0.03em] before:content-[attr(data-text)]"
      />
    </div>
  );
}
