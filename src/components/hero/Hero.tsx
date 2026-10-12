import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { m } from "motion/react";
import { useState } from "react";
import { paletteName } from "@/lib/palette-name";
import { shuffleWallpaper, useConfigStore, useRenderParams } from "@/store";
import { useLookHistoryStore } from "@/store/useLookHistoryStore";
import { LockScreen } from "../packs/DeviceFrames";
import { useWallpaperEngine } from "../studio/engine";
import { BauhausMarks } from "../ui/BauhausMarks";
import { InkButton } from "../ui/InkButton";
import { PAGE_COLUMN } from "../ui/layout";

/**
 * The first screen: the headline, a photographed phone floating over the paper
 * with the live wallpaper on its screen, and ‹ Shuffle › beside it. It stays
 * short so the packs show under it; the full Studio (style, colors, download)
 * comes after the packs, and "Customize it" leads there.
 *
 * The phone is a cut-out photo (public/assets/hero/phone.webp, 599 × 1283)
 * whose screen is transparent; the wallpaper canvas sits behind that hole. The
 * screen box below is measured on that photo, so a new photo needs new numbers.
 */
export function Hero() {
  const engine = useWallpaperEngine();
  const params = useRenderParams();
  const colors = useConfigStore((s) => s.colors);
  const canBack = useLookHistoryStore((s) => s.past.length > 0);
  const canForward = useLookHistoryStore((s) => s.future.length > 0);
  const [spins, setSpins] = useState(0);

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

        <div className="mt-[clamp(16px,2.2vw,28px)] grid items-center gap-x-10 gap-y-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
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
              Customize it ↓
            </a>
          </div>

          <figure className="relative m-0 justify-self-center">
            <div
              data-float
              className="relative w-[clamp(150px,min(15vw,calc((100svh-470px)/2.14)),224px)] motion-safe:animate-float"
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
                <LockScreen />
              </div>
              <img
                src="/assets/hero/phone.webp"
                alt=""
                width={599}
                height={1283}
                className="relative block h-auto w-full select-none"
                draggable={false}
              />
            </div>
            {/* The shadow stays on the paper and shrinks as the phone rises. */}
            <div
              aria-hidden
              className="mx-auto mt-3 h-[16px] w-[110%] -translate-x-[4.5%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(30_28_24/0.3),transparent)] motion-safe:animate-float-shadow"
            />
          </figure>

          <div className="flex flex-col items-center gap-3 md:items-start md:justify-self-start">
            <div role="toolbar" aria-label="Wallpaper controls" className="flex items-center gap-3">
              <InkButton
                variant="icon"
                onClick={() => useLookHistoryStore.getState().back()}
                aria-disabled={!canBack}
                aria-label="Previous wallpaper"
                className="aria-disabled:pointer-events-none aria-disabled:opacity-40"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </InkButton>
              <InkButton
                variant="round"
                onClick={shuffle}
                aria-label="Shuffle: generate another wallpaper"
              >
                <m.span
                  aria-hidden
                  animate={{ rotate: spins * 180 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14 }}
                  className="inline-flex"
                >
                  <Shuffle className="size-6" strokeWidth={2.1} />
                </m.span>
              </InkButton>
              <InkButton
                variant="icon"
                onClick={() => useLookHistoryStore.getState().forward()}
                aria-disabled={!canForward}
                aria-label="Next wallpaper"
                className="aria-disabled:pointer-events-none aria-disabled:opacity-40"
              >
                <ChevronRight className="size-5" aria-hidden />
              </InkButton>
            </div>
            <p className="m-0 hidden font-sans text-[12px] font-medium uppercase tracking-[0.18em] text-ink-dim md:block">
              Palette
            </p>
            <p
              aria-live="polite"
              className="m-0 hidden font-display text-[28px] font-medium leading-none text-ink md:block"
            >
              {paletteName(colors).toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
