import { useState } from "react";
import { getPacks, type Pack } from "@/lib/packs";
import { heroPackPeek, nextHeroPackPeek, pieceRenders } from "@/lib/packs/showcase";
import { paletteName } from "@/lib/palette-name";
import { DEVICE_SIZES } from "@/lib/palettes";
import { shuffleWallpaper, useConfigStore, useRenderParams } from "@/store";
import { LockScreen } from "../packs/DeviceFrames";
import { PackCover } from "../packs/PackCover";
import { useWallpaperEngine } from "../studio/engine";
import { ShuffleToolbar } from "../studio/v2/ShuffleToolbar";
import { BauhausMarks } from "../ui/BauhausMarks";
import { MotionToggle } from "../ui/MotionToggle";
import { useMotionStore } from "@/store/useMotionStore";
import { PAGE_COLUMN } from "../ui/layout";
import { PageLink } from "../ui/PageLink";
import { SectionLink } from "../ui/SectionLink";
import { HERO_PHONE_IMAGE, packPath } from "@/lib/seo/pages";

/**
 * The first screen: the headline, a photographed phone floating over the paper
 * with the live wallpaper on its screen, and ‹ Shuffle › beside it. It stays
 * short so the packs show under it; the full Studio (style, colors, download)
 * comes after the packs, and "Customise it" leads there. Every fifth shuffle
 * puts a pack piece on the screen instead (`heroPackPeek`), with a link to its
 * pack; on phones both packs also sit under the shuffle.
 *
 * The phone is a cut-out photo (public/assets/hero/phone.webp, 599 × 1283)
 * whose screen is transparent; the wallpaper canvas sits behind that hole. The
 * screen box below is measured on that photo, so a new photo needs new numbers.
 */
export function Hero({
  title = "make a gradient wallpaper. free, in 5K.",
  subtitle = "shuffle until it's yours.",
}: {
  title?: string;
  subtitle?: string;
} = {}) {
  const engine = useWallpaperEngine();
  const params = useRenderParams();
  const colors = useConfigStore((s) => s.colors);
  const [spins, setSpins] = useState(0);
  // The shuffle count a pack piece is showing for; stepping through the history clears it.
  const [peekAt, setPeekAt] = useState(0);
  const peek = heroPackPeek(PACKS, peekAt);
  // From the first shuffle on, the next pack piece waits on the screen, loaded but
  // transparent, so the fifth shuffle shows it at once instead of downloading it then.
  const piece = peek ?? (spins > 0 ? nextHeroPackPeek(PACKS, spins) : null);
  // Paused, the phone stops where it is instead of snapping back to rest.
  const hold = useMotionStore((s) => s.paused) ? "[animation-play-state:paused]" : "";

  const shuffle = () => {
    shuffleWallpaper();
    setSpins(spins + 1);
    setPeekAt(spins + 1);
  };

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className={`${PAGE_COLUMN} pb-[clamp(24px,2.5vw,36px)] pt-[clamp(84px,8vw,100px)]`}>
        <h1
          id="hero-title"
          className="display-head mx-auto max-w-[20ch] text-balance text-center text-[clamp(34px,3.3vw,52px)] text-ink md:max-w-none"
        >
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-[30ch] text-balance text-center font-sans text-[16px] text-ink-dim">
          {subtitle}
        </p>

        {/* Room above the phone for the width ruler and its label, plus the float
            (up 16px) and the tilt, so they never touch the headline. */}
        <div className="mt-[clamp(76px,6vw,88px)] max-md:mt-[60px] grid items-center gap-x-10 gap-y-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="hidden flex-col items-start gap-5 justify-self-end md:flex">
            <BauhausMarks size={22} />
            <p className="max-w-[30ch] font-sans text-[15px] text-ink-dim">
              Free gradient wallpapers made in your browser, sized for your screen. Up to 5120 ×
              2880, no account, no watermark.
            </p>
            <SectionLink
              to="studio"
              className="font-sans text-[14px] font-medium text-ink underline underline-offset-4 focus-ring"
            >
              Customise it ↓
            </SectionLink>
          </div>

          <figure className="relative m-0 justify-self-center">
            <div
              data-float
              // Phones also fit the packs row under the shuffle, so their phone is smaller.
              className={`relative w-[clamp(150px,min(15vw,calc((100svh-490px)/2.14)),224px)] max-md:w-[clamp(118px,calc((100svh-590px)/2.14),150px)] motion-safe:animate-float ${hold}`}
            >
              <div
                role="img"
                aria-label={
                  peek
                    ? `A wallpaper from the ${peek.pack.name} pack on a phone`
                    : "The current wallpaper on a phone"
                }
                // Flies into the Studio's screen when a link leads there (SectionLink).
                data-vt-src="hero-screen"
                className="absolute inset-x-[4.34%] inset-y-[1.71%] overflow-hidden rounded-[13.5%/6%] bg-ink"
              >
                <engine.Canvas
                  params={params}
                  device="mobile"
                  className="absolute inset-0 size-full object-cover"
                />
                {engine.Motion && <engine.Motion params={params} />}
                {piece && (
                  <PackCover
                    cover={piece.cover}
                    // The screen of the largest phone above: 224 px wide, 150 px on phones.
                    box={[224, 486]}
                    phoneBox={[137, 310]}
                    eager
                    decorative={!peek}
                    className={`absolute inset-0 size-full object-cover ${peek ? "" : "opacity-0"}`}
                  />
                )}
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
              {peek && (
                <PageLink
                  to={packPath(peek.pack.slug)}
                  className="absolute -bottom-4 left-1/2 inline-flex min-h-11 -translate-x-1/2 items-center whitespace-nowrap rounded-sharp bg-ink px-3 font-sans text-[13px] font-medium text-paper focus-ring"
                >
                  from the {peek.pack.name.toLowerCase()} pack · see all {peek.pack.previews.length}{" "}
                  →
                </PageLink>
              )}
            </div>
            {/* The shadow stays on the paper and shrinks as the phone rises. */}
            <div
              aria-hidden
              className={`mx-auto mt-3 h-[16px] w-[110%] -translate-x-[4.5%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(30_28_24/0.3),transparent)] motion-safe:animate-float-shadow ${hold}`}
            />
            <MotionToggle className="absolute -right-14 bottom-0" />
          </figure>

          <div className="flex flex-col items-center gap-3 md:items-start md:justify-self-start">
            <ShuffleToolbar
              spins={spins}
              onShuffle={shuffle}
              onStep={() => setPeekAt(0)}
              className="flex items-center gap-3"
            />
            <p className="m-0 hidden font-sans text-[12px] font-medium uppercase tracking-[0.18em] text-ink-dim md:block">
              {peek ? "Pack" : "Palette"}
            </p>
            <p
              aria-live="polite"
              className="m-0 hidden font-display text-[28px] font-medium leading-none text-ink md:block"
            >
              {peek ? peek.pack.name.toLowerCase() : paletteName(colors).toLowerCase()}
            </p>
            {/* Phones get both packs right here: the packs section is a screen further down. */}
            <PackRow />
          </div>
        </div>
      </div>
    </section>
  );
}

const PHONE = DEVICE_SIZES.mobile;
const PACKS = getPacks();

/** The cheapest pack, as the hero's packs row quotes it. */
const FROM_PRICE = `€${Math.min(...PACKS.map((p) => p.priceEur)).toFixed(2)}`;

/** Phones only: a small card per pack, under the shuffle, each opening its page. */
function PackRow() {
  return (
    <section
      aria-labelledby="hero-packs"
      className="mt-2 flex w-full max-w-[400px] flex-col gap-3 border-t-2 border-ink pt-3 md:hidden"
    >
      <h2
        id="hero-packs"
        className="m-0 font-sans text-[12px] font-medium uppercase tracking-[0.18em] text-ink-dim"
      >
        Or get a hand-picked pack · {FROM_PRICE}
      </h2>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0">
        {PACKS.map((pack) => (
          <li key={pack.slug}>
            <PackRowCard pack={pack} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PackRowCard({ pack }: { pack: Pack }) {
  return (
    <PageLink
      to={packPath(pack.slug)}
      className="flex min-h-11 items-center gap-3 rounded-sharp bg-paper-2 p-2 text-ink focus-ring"
    >
      <PackCover
        cover={pieceRenders(pack.previews[0]).phone!}
        box={[44, 82]}
        decorative
        className="h-[82px] w-[44px] shrink-0 rounded-[8px] border-[3px] border-ink object-cover"
      />
      <span className="flex flex-col gap-0.5">
        <span className="font-display text-[18px] font-medium leading-none">
          {pack.name.toLowerCase()}
        </span>
        <span className="font-sans text-[13px] text-ink-dim">{pack.previews.length} designs →</span>
      </span>
    </PageLink>
  );
}

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
