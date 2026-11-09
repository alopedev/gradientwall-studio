import { type ReactNode, useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import type { Pack, PackCover as PackCoverType } from "@/lib/packs";
import { preloadImage } from "@/lib/preload-image";
import { imageSources } from "@/lib/responsive-image";
import {
  pieceName,
  pieceRenders,
  showcaseViews,
  shuffleIndex,
  type ShowcaseView,
} from "@/lib/packs/showcase";
import { LaptopFrame, LockScreen, PhotoPhoneFrame } from "./DeviceFrames";
import { PackCover } from "./PackCover";

const FILL = "absolute inset-0 block h-full w-full object-cover";
const SWIPE_MIN_PX = 48;
/** Longest wait for the next wallpaper before swapping anyway. */
const SWAP_TIMEOUT_MS = 1500;

/**
 * Largest CSS size of each device's screen, and on phones the share of the
 * viewport the laptop screen's 16:9 image spans (82% or 100% of the width,
 * a 16:10 screen, so ×1.11), so a phone doesn't fetch the 1600 px file.
 */
const LAPTOP_BOX = [900, 563] as const;
const LAPTOP_ON_PHONES = { both: "92vw", desktop: "111vw" } as const;
const PHONE_BOX = [250, 540] as const;
/** The phone beside the laptop on phones: 30% of the width, so the centre crop is sharp enough. */
const PHONE_BESIDE_LAPTOP_ON_PHONES = [190, 410] as const;

const phoneOnPhones = (view: ShowcaseView) =>
  view === "both" ? PHONE_BESIDE_LAPTOP_ON_PHONES : undefined;

type Stage = { index: number; view: ShowcaseView };

/** The image files the stage shows for a piece in a view, as `PackCover` will request them. */
function stageFiles(piece: PackCoverType, view: ShowcaseView) {
  const renders = pieceRenders(piece);
  const shown: ShowcaseView = renders.desktop ? view : "phone";
  const files = [];
  if (shown !== "phone" && renders.desktop?.kind === "image") {
    files.push(imageSources(renders.desktop, LAPTOP_BOX, LAPTOP_ON_PHONES[shown]));
  }
  if (shown !== "desktop" && renders.phone?.kind === "image") {
    files.push(imageSources(renders.phone, PHONE_BOX, phoneOnPhones(shown)));
  }
  return files;
}
const VIEW_LABEL: Record<ShowcaseView, string> = {
  both: "Both",
  phone: "Phone",
  desktop: "Desktop",
};

/**
 * The hero of a pack page: the current design on a laptop and a phone on the
 * page's paper, with the page's title (`header`) and buy action (`buy`).
 * Arrows, keys, swipe, Shuffle and a thumbnail rail move through the pack one
 * design at a time.
 *
 * From `lg` it is two columns (3C, chosen 2026-11-09): title, buy action and
 * `details` on the left, so the price and the button are on the first screen,
 * and the devices on the right. Below `lg` the two columns dissolve
 * (`display: contents`) and `order` lays their parts out as one page: title,
 * view switch, devices, arrows, buy action.
 */
export function PackShowcase({
  pack,
  header,
  buy,
  details,
}: {
  pack: Pack;
  header: ReactNode;
  buy: ReactNode;
  /** What a buyer checks before paying (delivery, files); shown in the desktop column only. */
  details?: ReactNode;
}) {
  const views = showcaseViews(pack);
  const total = pack.previews.length;
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<ShowcaseView>(views[0]);
  // What the devices show: lags the selection until its files have loaded, so a
  // change never paints a black screen filling in strip by strip.
  const [stage, setStage] = useState<Stage>({ index: 0, view: views[0] });
  const touch = useRef<{ x: number; y: number } | null>(null);
  const loaded = useRef(new Map<string, Promise<void> | null>());
  const nextShuffle = useRef<number | null>(null);

  const go = (to: number) => setIndex(((to % total) + total) % total);

  /** Starts loading the stage files of piece `i` in the current view, once per file. */
  const load = (i: number, v: ShowcaseView) =>
    stageFiles(pack.previews[i], v).map((f) => {
      const key = `${f.src} ${f.srcSet ?? ""}`;
      if (!loaded.current.has(key)) loaded.current.set(key, preloadImage(f));
      return loaded.current.get(key) ?? null;
    });

  // biome-ignore lint/correctness/useExhaustiveDependencies: load reads only refs and the pack
  useEffect(() => {
    if (stage.index === index && stage.view === view) return;
    const ready = load(index, view);
    if (ready.some((r) => r === null)) {
      setStage({ index, view });
      return;
    }
    let live = true;
    const swap = () => live && setStage({ index, view });
    const timer = setTimeout(swap, SWAP_TIMEOUT_MS);
    Promise.all(ready).then(swap);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [index, view, stage]);

  // Once the page has loaded, fetch what the arrows and Shuffle lead to next.
  // biome-ignore lint/correctness/useExhaustiveDependencies: load reads only refs and the pack
  useEffect(() => {
    if (total < 2) return;
    nextShuffle.current = shuffleIndex(stage.index, total);
    const ahead = () => {
      for (const i of [stage.index + 1, stage.index - 1 + total, nextShuffle.current ?? 0]) {
        load(i % total, stage.view);
      }
    };
    if (document.readyState === "complete") ahead();
    else {
      window.addEventListener("load", ahead, { once: true });
      return () => window.removeEventListener("load", ahead);
    }
  }, [stage, total]);

  const piece = pack.previews[stage.index];
  const renders = pieceRenders(piece);
  // A mixed pack may have a piece without a desktop file: show its phone render rather than nothing.
  const shown: ShowcaseView = renders.desktop ? stage.view : "phone";
  const name = pieceName(pack.previews[index]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${pack.name} wallpapers`}
      className="relative isolate min-w-0 overflow-hidden"
      onKeyDown={(e) => {
        if (total < 2) return;
        if (e.key === "ArrowRight") go(index + 1);
        else if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div className="mx-auto max-w-[1600px] px-[clamp(16px,4vw,56px)] pt-[clamp(96px,10vw,128px)] pb-[clamp(20px,3vw,40px)]">
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-x-[clamp(40px,5vw,80px)]">
          <div data-showcase="info" className="contents lg:block">
            <div className="order-1 min-w-0">{header}</div>
            {buy && (
              <div className="order-5 self-center max-md:mt-3 sm:justify-self-center md:col-start-2 md:justify-self-end lg:mt-6 lg:justify-self-stretch">
                {buy}
              </div>
            )}
            {details && <div className="hidden lg:mt-4 lg:block">{details}</div>}
          </div>

          <div data-showcase="devices" className="contents lg:flex lg:min-w-0 lg:flex-col">
            {views.length > 1 && (
              <div className="order-2 self-start justify-self-start max-md:mt-4 md:justify-self-end lg:self-end">
                <ViewSwitch views={views} value={view} onChange={setView} />
              </div>
            )}

            <div
              data-testid="showcase-stage"
              className="order-3 flex min-h-[clamp(260px,42vw,560px)] items-end justify-center py-[clamp(16px,3vw,32px)] md:col-span-2 lg:min-h-0"
              onTouchStart={(e) => {
                const t = e.touches[0];
                touch.current = { x: t.clientX, y: t.clientY };
              }}
              onTouchEnd={(e) => {
                const start = touch.current;
                touch.current = null;
                if (!start || total < 2) return;
                const t = e.changedTouches[0];
                const dx = t.clientX - start.x;
                const dy = t.clientY - start.y;
                if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
                  go(index + (dx < 0 ? 1 : -1));
                }
              }}
            >
              <m.div
                key={`${stage.index}-${shown}`}
                className="flex w-full items-end justify-center"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {shown !== "phone" && renders.desktop && (
                  <LaptopFrame
                    className={`drop-shadow-[0_30px_40px_rgba(0,0,0,0.25)] ${
                      shown === "both"
                        ? "w-[82%] sm:w-[min(66%,760px)] lg:w-[80%]"
                        : "w-full sm:w-[min(80%,900px)] lg:w-full"
                    }`}
                  >
                    <PackCover
                      cover={renders.desktop}
                      w={1280}
                      h={800}
                      box={LAPTOP_BOX}
                      phoneBox={LAPTOP_ON_PHONES[shown]}
                      className={FILL}
                      priority
                    />
                  </LaptopFrame>
                )}
                {shown !== "desktop" && (
                  <PhotoPhoneFrame
                    data-vt="pack-phone"
                    className={`relative z-10 drop-shadow-[0_30px_30px_rgba(0,0,0,0.3)] ${
                      shown === "both"
                        ? "-mb-[1%] -ml-[18%] w-[30%] sm:-ml-[7%] sm:w-[min(17%,190px)] lg:-ml-[9%] lg:w-[min(21%,190px)]"
                        : "w-[58%] sm:w-[min(36%,250px)]"
                    }`}
                  >
                    <PackCover
                      cover={renders.phone!}
                      w={720}
                      h={1560}
                      box={PHONE_BOX}
                      phoneBox={phoneOnPhones(shown)}
                      className={FILL}
                      priority
                    />
                    <LockScreen />
                  </PhotoPhoneFrame>
                )}
              </m.div>
            </div>

            {total > 1 ? (
              <div className="order-4 flex items-center gap-2.5 self-center justify-self-center md:justify-self-start lg:self-center">
                <ArrowButton side="prev" onClick={() => go(index - 1)} />
                <div
                  aria-live="polite"
                  className="min-w-[104px] text-center font-sans tabular-nums text-[13px] text-ink-dim"
                >
                  {name && <span className="block text-[15px] font-medium text-ink">{name}</span>}
                  {String(index + 1).padStart(2, "0")} / {total}
                </div>
                <ArrowButton side="next" onClick={() => go(index + 1)} />
                <button
                  type="button"
                  onClick={() => {
                    const ahead = nextShuffle.current;
                    go(ahead !== null && ahead !== index ? ahead : shuffleIndex(index, total));
                  }}
                  className="min-h-11 cursor-pointer rounded-sharp px-4 font-sans text-[14px] font-medium text-ink shadow-[inset_0_0_0_2px_var(--color-ink)] transition-colors hover:bg-ink hover:text-bg"
                >
                  Shuffle
                </button>
              </div>
            ) : (
              <span className="order-4" />
            )}
          </div>
        </div>
      </div>

      {total > 1 && <Rail pack={pack} index={index} onSelect={setIndex} />}
    </section>
  );
}

function ViewSwitch({
  views,
  value,
  onChange,
}: {
  views: ShowcaseView[];
  value: ShowcaseView;
  onChange: (v: ShowcaseView) => void;
}) {
  return (
    <fieldset
      aria-label="Device"
      className="m-0 flex min-w-0 rounded-sharp p-1 shadow-[inset_0_0_0_2px_var(--color-ink)]"
    >
      {views.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`min-h-9 cursor-pointer rounded-[2px] px-3.5 font-sans text-[12px] font-medium transition-colors ${
            value === v ? "bg-ink text-bg" : "text-ink-dim hover:text-ink"
          }`}
        >
          {VIEW_LABEL[v]}
        </button>
      ))}
    </fieldset>
  );
}

function ArrowButton({ side, onClick }: { side: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === "prev" ? "Previous wallpaper" : "Next wallpaper"}
      onClick={onClick}
      className="grid size-11 cursor-pointer place-items-center rounded-full bg-bg text-ink shadow-[inset_0_0_0_2px_var(--color-ink)] transition-[background-color,color,scale] hover:scale-105 hover:bg-ink hover:text-bg active:scale-95 motion-reduce:transition-none"
    >
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative; the button carries the label */}
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={side === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

/** One thumbnail per design, desktop render where there is one. */
function Rail({
  pack,
  index,
  onSelect,
}: {
  pack: Pack;
  index: number;
  onSelect: (i: number) => void;
}) {
  const rail = useRef<HTMLFieldSetElement>(null);

  // Keep the current thumbnail in view without scrolling the page itself.
  useEffect(() => {
    const box = rail.current;
    const thumb = box?.children[index] as HTMLElement | undefined;
    if (!box || !thumb || typeof box.scrollTo !== "function") return;
    box.scrollTo({
      left: thumb.offsetLeft - box.clientWidth / 2 + thumb.clientWidth / 2,
      behavior: "smooth",
    });
  }, [index]);

  return (
    <fieldset
      ref={rail}
      aria-label={`${pack.name} designs`}
      className="m-0 flex min-w-0 snap-x gap-2 overflow-x-auto border-0 border-y-2 border-ink bg-bg-2 px-[clamp(16px,4vw,56px)] py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {pack.previews.map((piece, i) => {
        const r = pieceRenders(piece);
        const art = r.desktop ?? r.phone!;
        const landscape = r.desktop !== null;
        return (
          <button
            key={piece.kind === "image" ? piece.url : `gradient-${piece.seed}`}
            type="button"
            aria-label={`Show design ${i + 1} of ${pack.previews.length}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => onSelect(i)}
            className={`relative shrink-0 snap-start cursor-pointer overflow-hidden rounded-[10px] transition-opacity duration-300 hover:opacity-90 motion-reduce:transition-none ${
              landscape ? "aspect-[16/9] w-[92px] sm:w-[120px]" : "aspect-[9/16] w-14"
            } ${
              i === index
                ? "opacity-100 shadow-[0_0_0_2px_var(--color-bg-2),0_0_0_4px_var(--color-ink)]"
                : "opacity-60"
            }`}
          >
            <PackCover
              cover={art}
              w={240}
              h={landscape ? 135 : 400}
              box={landscape ? [120, 68] : [56, 100]}
              className={FILL}
            />
          </button>
        );
      })}
    </fieldset>
  );
}
