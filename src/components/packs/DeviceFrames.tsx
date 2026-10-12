import type { CSSProperties, ReactNode } from "react";
import type { PackCover as PackCoverType } from "@/lib/packs";
import { PackCover } from "./PackCover";

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

const FILL = "absolute inset-0 block h-full w-full object-cover";

/**
 * Laptop with a phone leaning in front of it: the catalog cover. Either
 * render can be missing (a portrait-only pack has no desktop file).
 */
export function DeviceDuo({
  phone,
  desktop,
  className = "",
}: {
  phone: PackCoverType | null;
  desktop: PackCoverType | null;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[16/10.5] w-full ${className}`}>
      {desktop && (
        <LaptopFrame className="absolute left-0 top-[4%] w-[86%] drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]">
          <PackCover cover={desktop} w={960} h={600} className={FILL} />
        </LaptopFrame>
      )}
      {phone && (
        <PhoneFrame
          className={`absolute bottom-0 rotate-[4deg] shadow-[-20px_30px_50px_-10px_rgba(0,0,0,0.85)] transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:-translate-y-2 group-hover:rotate-0 ${
            desktop ? "right-0 w-[30%]" : "left-1/2 w-[44%] -translate-x-1/2"
          }`}
        >
          <PackCover cover={phone} w={480} h={1040} className={FILL} />
        </PhoneFrame>
      )}
    </div>
  );
}
