import { type ReactNode, useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import type { Pack } from "@/lib/packs";
import {
  pieceName,
  pieceRenders,
  showcaseViews,
  shuffleIndex,
  type ShowcaseView,
} from "@/lib/packs/showcase";
import { LaptopFrame, PhoneFrame } from "./DeviceFrames";
import { PackCover } from "./PackCover";

const FILL = "absolute inset-0 block h-full w-full object-cover";
const SWIPE_MIN_PX = 48;
const VIEW_LABEL: Record<ShowcaseView, string> = {
  both: "Both",
  phone: "Phone",
  desktop: "Desktop",
};

/**
 * The hero of a pack page: the current design on a laptop and a phone over a
 * blur of its own colours, with the page's title (`header`) and buy action
 * (`buy`) on top. Arrows, keys, swipe, Shuffle and a thumbnail rail move
 * through the pack one design at a time.
 */
export function PackShowcase({
  pack,
  header,
  buy,
}: {
  pack: Pack;
  header: ReactNode;
  buy: ReactNode;
}) {
  const views = showcaseViews(pack);
  const total = pack.previews.length;
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<ShowcaseView>(views[0]);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = (to: number) => setIndex(((to % total) + total) % total);
  const piece = pack.previews[index];
  const renders = pieceRenders(piece);
  // A mixed pack may have a piece without a desktop file: show its phone render rather than nothing.
  const shown: ShowcaseView = renders.desktop ? view : "phone";
  const name = pieceName(piece);
  const glow = renders.desktop ?? renders.phone!;

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
      {/* The design's own colours, blurred, as the light of the whole hero. */}
      <PackCover
        cover={glow}
        w={240}
        h={240}
        className="pointer-events-none absolute -inset-[10%] -z-10 h-[120%] w-[120%] object-cover opacity-70 blur-3xl saturate-125 brightness-[0.55] transition-opacity duration-500"
        decorative
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_110%,rgba(10,10,13,0.95),transparent_60%),linear-gradient(rgba(10,10,13,0.55),transparent_35%)]"
      />

      <div className="mx-auto max-w-[1600px] px-[clamp(16px,4vw,56px)] pt-[clamp(96px,10vw,128px)] pb-[clamp(20px,3vw,40px)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">{header}</div>
          {views.length > 1 && <ViewSwitch views={views} value={view} onChange={setView} />}
        </div>

        <div
          data-testid="showcase-stage"
          className="flex min-h-[clamp(260px,42vw,560px)] items-end justify-center py-[clamp(16px,3vw,32px)]"
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
            key={`${index}-${shown}`}
            className="flex w-full items-end justify-center"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {shown !== "phone" && renders.desktop && (
              <LaptopFrame
                className={`drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)] ${
                  shown === "both"
                    ? "w-[82%] sm:w-[min(66%,760px)]"
                    : "w-full sm:w-[min(80%,900px)]"
                }`}
              >
                <PackCover cover={renders.desktop} w={1280} h={800} className={FILL} priority />
              </LaptopFrame>
            )}
            {shown !== "desktop" && (
              <PhoneFrame
                className={`relative z-10 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.9)] ${
                  shown === "both"
                    ? "-mb-[1%] -ml-[18%] w-[30%] sm:-ml-[7%] sm:w-[min(17%,190px)]"
                    : "w-[58%] sm:w-[min(36%,250px)]"
                }`}
              >
                <PackCover cover={renders.phone!} w={720} h={1560} className={FILL} priority />
                <LockScreen />
              </PhoneFrame>
            )}
          </m.div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-between">
          {total > 1 ? (
            <div className="flex items-center gap-2.5">
              <ArrowButton side="prev" onClick={() => go(index - 1)} />
              <div
                aria-live="polite"
                className="min-w-[104px] text-center font-sans tabular-nums text-[13px] text-white/60"
              >
                {name && <span className="block text-[15px] font-medium text-white">{name}</span>}
                {String(index + 1).padStart(2, "0")} / {total}
              </div>
              <ArrowButton side="next" onClick={() => go(index + 1)} />
              <button
                type="button"
                onClick={() => go(shuffleIndex(index, total))}
                className="min-h-11 cursor-pointer rounded-[14px] border border-white/20 bg-white/[0.06] px-4 font-sans text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md transition-colors hover:bg-white/[0.12]"
              >
                Shuffle
              </button>
            </div>
          ) : (
            <span />
          )}
          {buy}
        </div>
      </div>

      {total > 1 && <Rail pack={pack} index={index} onSelect={setIndex} />}
    </section>
  );
}

/** The time on top of the phone render, so the wallpaper reads as a lock screen. */
function LockScreen() {
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
      className="m-0 flex min-w-0 rounded-full border border-white/14 bg-black/45 p-1 backdrop-blur-md"
    >
      {views.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`min-h-9 cursor-pointer rounded-full px-3.5 font-sans text-[12px] font-medium transition-colors ${
            value === v ? "bg-white text-[#0a0a0d]" : "text-white/60 hover:text-white"
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
      className="grid size-11 cursor-pointer place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition-[background-color,scale] hover:scale-105 hover:bg-black/55 active:scale-95 motion-reduce:transition-none"
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
      className="m-0 flex min-w-0 snap-x gap-2 overflow-x-auto border-0 border-y border-white/8 bg-[#0a0a0d]/60 px-[clamp(16px,4vw,56px)] py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              i === index ? "opacity-100 shadow-[0_0_0_2px_#0a0a0d,0_0_0_3.5px_#fff]" : "opacity-55"
            }`}
          >
            <PackCover cover={art} w={240} h={landscape ? 135 : 400} className={FILL} />
          </button>
        );
      })}
    </fieldset>
  );
}
