import { type CSSProperties, useRef } from "react";
import { Link } from "react-router-dom";
import { m, useInView } from "motion/react";
import { describeContents, isPhoneAndDesktop, type Pack } from "@/lib/packs";
import { coverRenders, fanPieces } from "@/lib/packs/showcase";
import { LockScreen, PhoneFrame } from "./DeviceFrames";
import { PackCover } from "./PackCover";

const FILL = "absolute inset-0 block h-full w-full object-cover";

/**
 * Catalog card: the pack as a stack of phones over its own blurred colours.
 * Hover or keyboard focus fans the stack open to show the designs inside; on
 * touch screens (no hover) it opens once the card is on screen.
 */
export function PackCard({ pack }: { pack: Pack }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const open = inView && !canHover();
  const fan = fanPieces(pack);
  const { phone, desktop } = coverRenders(pack);
  const glow = desktop ?? phone!;
  const price = `€${pack.priceEur.toFixed(2)}`;
  return (
    <Link
      ref={ref}
      to={`/packs/${pack.slug}`}
      data-open={open || undefined}
      className="group relative flex h-full min-h-[500px] flex-col overflow-hidden rounded-[20px] border border-white/8 bg-[#0a0a0d] transition-[border-color,box-shadow] duration-300 hover:border-white/20 hover:shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
    >
      {/* The pack's own colours, blurred, as the stage light behind the phones. */}
      <PackCover
        cover={glow}
        w={240}
        h={240}
        decorative
        className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
        style={{
          background:
            "linear-gradient(to top, rgba(7,7,10,0.92) 0%, rgba(7,7,10,0.5) 45%, rgba(7,7,10,0) 100%)",
        }}
      />

      <span className="absolute right-4 top-4 z-20 rounded-full border border-white/18 bg-black/50 px-3 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
        {pack.previews.length} designs
      </span>

      <div className="relative z-10 flex flex-1 items-end justify-center px-6 pt-16 pb-6">
        <div className="relative aspect-[4/3] w-[74%] sm:w-[min(86%,380px)]">
          {fan.map(({ cover, offset }) => (
            <PhoneFrame
              key={offset}
              className="absolute bottom-0 left-[33%] w-[34%] origin-[50%_120%] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)] transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none [transform:var(--rest)] group-hover:[transform:var(--open)] group-focus-visible:[transform:var(--open)] group-data-[open]:[transform:var(--open)]"
              style={fanStyle(offset)}
            >
              <PackCover
                cover={cover}
                w={480}
                h={1040}
                className={FILL}
                decorative={offset !== 0}
              />
              {offset === 0 && <LockScreen />}
            </PhoneFrame>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <m.h3
            layoutId={`pack-${pack.slug}-title`}
            className="m-0 font-serif italic font-normal text-[clamp(32px,3.4vw,48px)] leading-[0.95] tracking-tight text-white"
          >
            {pack.name}.
          </m.h3>
          <p className="m-0 mt-2 font-serif italic text-[15px] leading-snug text-white/80">
            {pack.tagline}
          </p>
          <ul className="m-0 mt-4 flex list-none flex-wrap gap-1.5 p-0">
            <Tag>{describeContents(pack)}</Tag>
            {isPhoneAndDesktop(pack) && <Tag>Phone + desktop</Tag>}
            <Tag>4K · 5K</Tag>
          </ul>
        </div>
        <span className="shrink-0 rounded-full bg-white/95 px-3 py-1.5 font-sans text-[13px] font-medium tracking-tight text-[#0a0a0d]">
          {price}
        </span>
      </div>
    </Link>
  );
}

/**
 * Where one phone sits, stacked (`--rest`: a slight tilt, like a deck) and
 * fanned (`--open`: spread out and rotated around a point below the stack).
 * Percentages are of the phone itself, so the fan scales with the card.
 */
function fanStyle(offset: number): CSSProperties {
  const depth = Math.abs(offset);
  return {
    zIndex: 10 - depth,
    "--rest": `rotate(${offset * 4}deg) translateY(${depth * 2}%)`,
    "--open": `translateX(${offset * 38}%) rotate(${offset * 12}deg) translateY(${depth * 2 - 8}%)`,
  } as CSSProperties;
}

function canHover(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-white/14 bg-black/45 px-2.5 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/75 backdrop-blur-md">
      {children}
    </li>
  );
}
