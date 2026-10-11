import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import type { Pack } from "@/lib/packs";
import { pieceRenders, showcaseDevices, type ShowcaseDevice } from "@/lib/packs/showcase";
import { LaptopFrame, PhoneFrame } from "./DeviceFrames";
import { PackCover } from "./PackCover";

const FILL = "absolute inset-0 block h-full w-full object-cover";
const SWIPE_MIN_PX = 48;

/**
 * Cover carousel of a pack page: the current wallpaper on a phone or a
 * laptop, a Phone/Desktop switch, arrows (and keys, and swipe) and a rail of
 * thumbnails. One piece at a time, so a 10-piece pack stays a single screen.
 */
export function PackShowcase({ pack }: { pack: Pack }) {
  const devices = showcaseDevices(pack);
  const total = pack.previews.length;
  const [index, setIndex] = useState(0);
  const [device, setDevice] = useState<ShowcaseDevice>("phone");
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = (to: number) => setIndex(((to % total) + total) % total);
  const renders = pieceRenders(pack.previews[index]);
  // A mixed pack may have a piece without a desktop file: show its phone render rather than nothing.
  const shown: ShowcaseDevice = device === "desktop" && renders.desktop ? "desktop" : "phone";
  const current = (shown === "desktop" ? renders.desktop : renders.phone)!;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${pack.name} wallpapers`}
      className="min-w-0 lg:sticky lg:top-24"
      onKeyDown={(e) => {
        if (total < 2) return;
        if (e.key === "ArrowRight") go(index + 1);
        else if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div
        data-testid="showcase-stage"
        className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[20px] border border-white/8 bg-[#0a0a0d] sm:aspect-[5/4]"
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
        {/* The wallpaper's own colours, blurred, as the stage light. */}
        <PackCover
          cover={current}
          w={240}
          h={240}
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-3xl"
          decorative
        />

        <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-3">
          <span
            aria-live="polite"
            className="rounded-full border border-white/14 bg-black/45 px-3 py-1.5 font-sans text-[11px] font-medium tracking-[0.18em] text-white/85 backdrop-blur-md"
          >
            {String(index + 1).padStart(2, "0")} / {total}
          </span>
          {devices.length > 1 && <DeviceSwitch value={shown} onChange={setDevice} />}
        </div>

        <m.div
          key={`${index}-${shown}`}
          className="relative z-10 flex h-full w-full items-center justify-center"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {shown === "phone" ? (
            <PhoneFrame className="h-[78%] shadow-[0_50px_90px_-30px_rgba(0,0,0,0.9)]">
              <PackCover cover={current} w={720} h={1560} className={FILL} priority />
            </PhoneFrame>
          ) : (
            <LaptopFrame className="w-[84%] drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]">
              <PackCover cover={current} w={1280} h={800} className={FILL} priority />
            </LaptopFrame>
          )}
        </m.div>

        {total > 1 && (
          <>
            <ArrowButton side="prev" onClick={() => go(index - 1)} />
            <ArrowButton side="next" onClick={() => go(index + 1)} />
          </>
        )}
      </div>

      {total > 1 && <Rail pack={pack} index={index} device={shown} onSelect={setIndex} />}
    </section>
  );
}

function DeviceSwitch({
  value,
  onChange,
}: {
  value: ShowcaseDevice;
  onChange: (d: ShowcaseDevice) => void;
}) {
  return (
    <fieldset
      aria-label="Device"
      className="m-0 flex min-w-0 rounded-full border border-white/14 bg-black/45 p-1 backdrop-blur-md"
    >
      {(["phone", "desktop"] as const).map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={value === d}
          onClick={() => onChange(d)}
          className={`min-h-9 cursor-pointer rounded-full px-3.5 font-sans text-[12px] font-medium transition-colors ${
            value === d ? "bg-white/18 text-white" : "text-white/55 hover:text-white"
          }`}
        >
          {d === "phone" ? "Phone" : "Desktop"}
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
      className={`absolute top-1/2 z-20 grid size-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/14 bg-black/35 text-white backdrop-blur-md transition-[background-color,scale] hover:bg-black/55 hover:scale-105 active:scale-95 motion-reduce:transition-none ${
        side === "prev" ? "left-3" : "right-3"
      }`}
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

function Rail({
  pack,
  index,
  device,
  onSelect,
}: {
  pack: Pack;
  index: number;
  device: ShowcaseDevice;
  onSelect: (i: number) => void;
}) {
  const rail = useRef<HTMLFieldSetElement>(null);

  // Keep the current thumbnail in view without scrolling the page itself.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `device` changes the thumbnail sizes, so the current one must be re-centred
  useEffect(() => {
    const box = rail.current;
    const thumb = box?.children[index] as HTMLElement | undefined;
    if (!box || !thumb || typeof box.scrollTo !== "function") return;
    box.scrollTo({
      left: thumb.offsetLeft - box.clientWidth / 2 + thumb.clientWidth / 2,
      behavior: "smooth",
    });
  }, [index, device]);

  return (
    <fieldset
      ref={rail}
      aria-label={`${pack.name} wallpapers`}
      className="m-0 mt-3 flex min-w-0 border-0 snap-x gap-2 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {pack.previews.map((piece, i) => {
        const r = pieceRenders(piece);
        const art = (device === "desktop" ? r.desktop : r.phone) ?? r.phone!;
        const landscape = device === "desktop" && r.desktop !== null;
        return (
          <button
            key={piece.kind === "image" ? piece.url : `gradient-${piece.seed}`}
            type="button"
            aria-label={`Show wallpaper ${i + 1} of ${pack.previews.length}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => onSelect(i)}
            className={`relative shrink-0 snap-start cursor-pointer overflow-hidden rounded-xl transition-[opacity,translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:opacity-90 motion-reduce:transition-none ${
              landscape ? "aspect-[16/9] w-28" : "aspect-[9/16] w-14"
            } ${
              i === index ? "opacity-100 shadow-[0_0_0_2px_#0a0a0d,0_0_0_3.5px_#fff]" : "opacity-55"
            }`}
          >
            <PackCover cover={art} w={224} h={landscape ? 126 : 400} className={FILL} />
          </button>
        );
      })}
    </fieldset>
  );
}
