import { useState } from "react";
import { getPacks } from "@/lib/packs";
import { paletteName } from "@/lib/palette-name";
import { DEVICE_SIZES } from "@/lib/palettes";
import { shuffleWallpaper, useConfigStore, useRenderParams } from "@/store";
import { LockScreen } from "../packs/DeviceFrames";
import { useWallpaperEngine } from "../studio/engine";
import { ScreenMotion } from "../studio/v2/ScreenMotion";
import { ShuffleToolbar } from "../studio/v2/ShuffleToolbar";
import { BauhausMarks } from "../ui/BauhausMarks";
import { MotionToggle } from "../ui/MotionToggle";
import { useMotionStore } from "@/store/useMotionStore";
import { PAGE_COLUMN } from "../ui/layout";
import { HERO_PHONE_IMAGE } from "@/lib/seo/pages";

/**
 * The first screen: the headline, a photographed phone floating over the paper
 * with the live wallpaper on its screen, and ‹ Shuffle › beside it. It stays
 * short so the packs show under it; the full Studio (style, colors, download)
 * comes after the packs, and "Customise it" leads there.
 *
 * The phone is a cut-out photo (public/assets/hero/phone.webp, 599 × 1283)
 * whose screen is transparent; the wallpaper canvas sits behind that hole. The
 * screen box below is measured on that photo, so a new photo needs new numbers.
 */
export function Hero() {
  const engine = useWallpaperEngine();
  const params = useRenderParams();
  const colors = useConfigStore((s) => s.colors);
  const [spins, setSpins] = useState(0);
  // Paused, the phone stops where it is instead of snapping back to rest.
  const hold = useMotionStore((s) => s.paused) ? "[animation-play-state:paused]" : "";

  const shuffle = () => {
    shuffleWallpaper();
    setSpins((n) => n + 1);
  };

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className={`${PAGE_COLUMN} pb-[clamp(24px,2.5vw,36px)] pt-[clamp(84px,8vw,100px)]`}>
        <h1
          id="hero-title"
          className="display-head mx-auto max-w-[20ch] text-balance text-center text-[clamp(34px,3.3vw,52px)] text-ink md:max-w-none"
        >
          make a gradient wallpaper. shuffle until it's yours.
        </h1>

        {/* Room above the phone for the width ruler and its label, plus the float
            (up 16px) and the tilt, so they never touch the headline. */}
        <div className="mt-[clamp(76px,6vw,88px)] grid items-center gap-x-10 gap-y-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="hidden flex-col items-start gap-5 justify-self-end md:flex">
            <BauhausMarks size={22} />
            <p className="max-w-[30ch] font-sans text-[15px] text-ink-dim">
              Free gradient wallpapers made in your browser, sized for your screen. Up to 5120 ×
              2880, no account, no watermark.
            </p>
            <a
              href="#studio"
              className="font-sans text-[14px] font-medium text-ink underline underline-offset-4 focus-ring"
            >
              Customise it ↓
            </a>
          </div>

          <figure className="relative m-0 justify-self-center">
            <div
              data-float
              className={`relative w-[clamp(150px,min(15vw,calc((100svh-490px)/2.14)),224px)] motion-safe:animate-float ${hold}`}
            >
              <div
                role="img"
                aria-label="The current wallpaper on a phone"
                className="absolute inset-x-[4.34%] inset-y-[1.71%] overflow-hidden rounded-[13.5%/6%] bg-ink"
              >
                <engine.Canvas
                  params={params}
                  device="mobile"
                  className="absolute inset-0 size-full object-cover"
                />
                <ScreenMotion params={params} />
                <LockScreen />
              </div>
              <img
                src={HERO_PHONE_IMAGE}
                alt=""
                // Preloaded in the prerendered head; React 18 has no fetchPriority prop.
                {...{ fetchpriority: "high" }}
                width={599}
                height={1283}
                className="relative block h-auto w-full select-none"
                draggable={false}
              />
              <Rulers />
            </div>
            {/* The shadow stays on the paper and shrinks as the phone rises. */}
            <div
              aria-hidden
              className={`mx-auto mt-3 h-[16px] w-[110%] -translate-x-[4.5%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(30_28_24/0.3),transparent)] motion-safe:animate-float-shadow ${hold}`}
            />
            <MotionToggle className="absolute -right-14 bottom-0" />
          </figure>

          <div className="flex flex-col items-center gap-3 md:items-start md:justify-self-start">
            <ShuffleToolbar spins={spins} onShuffle={shuffle} className="flex items-center gap-3" />
            <p className="m-0 hidden font-sans text-[12px] font-medium uppercase tracking-[0.18em] text-ink-dim md:block">
              Palette
            </p>
            <p
              aria-live="polite"
              className="m-0 hidden font-display text-[28px] font-medium leading-none text-ink md:block"
            >
              {paletteName(colors).toLowerCase()}
            </p>
            {/* Phones don't get the column beside the phone: say the same here, shorter. */}
            <div className="mt-2 flex flex-col items-center gap-3 text-center md:hidden">
              <p className="m-0 max-w-[26ch] text-balance font-sans text-[16px] leading-snug text-ink-dim">
                Free, up to 5K, no account, no watermark.
              </p>
              <a
                href="#packs"
                className="inline-flex min-h-11 items-center font-sans text-[15px] font-semibold text-ink underline underline-offset-4 focus-ring"
              >
                Or get a hand-picked pack, {FROM_PRICE} →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PHONE = DEVICE_SIZES.mobile;

/** The cheapest pack, as the hero's link to the store quotes it. */
const FROM_PRICE = `€${Math.min(...getPacks().map((p) => p.priceEur)).toFixed(2)}`;

/**
 * Drafting-table rulers around the phone, labelled with the size a phone
 * download has: the wallpaper is made to measure. They float with the phone.
 */
function Rulers() {
  const label = "font-sans text-[11px] font-medium tabular-nums tracking-[0.08em] text-ink-dim";
  return (
    <div data-rulers aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 -top-[22px] h-[9px] border-x border-ink-dim">
        <div className="absolute inset-x-0 top-1/2 border-t border-ink-dim" />
        <span className={`${label} absolute bottom-full left-1/2 -translate-x-1/2 pb-1`}>
          {PHONE.w} px
        </span>
      </div>
      <div className="absolute inset-y-0 -left-[22px] w-[9px] border-y border-ink-dim">
        <div className="absolute inset-y-0 left-1/2 border-l border-ink-dim" />
        <span
          className={`${label} absolute right-full top-1/2 -translate-y-1/2 whitespace-nowrap pr-1 [writing-mode:vertical-rl] rotate-180`}
        >
          {PHONE.h} px
        </span>
      </div>
    </div>
  );
}
