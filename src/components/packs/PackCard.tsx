import { type CSSProperties, useRef } from "react";
import { Link } from "react-router-dom";
import { m, useInView } from "motion/react";
import { describeContents, isPhoneAndDesktop, type Pack } from "@/lib/packs";
import { fanPieces } from "@/lib/packs/showcase";
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
  const price = `€${pack.priceEur.toFixed(2)}`;
  return (
    <Link
      ref={ref}
      to={`/packs/${pack.slug}`}
      data-open={open || undefined}
      className="group relative flex h-full min-h-[500px] flex-col overflow-hidden rounded-sharp border-2 border-ink bg-bg-2 transition-colors duration-300 hover:bg-[#cfcec9]"
    >
      <span className="absolute right-4 top-4 z-20 rounded-sharp bg-ink px-2.5 py-1 font-sans text-[12px] font-medium text-bg">
        {pack.previews.length} designs
      </span>

      <div className="relative z-10 flex flex-1 items-end justify-center px-6 pt-16 pb-6">
        <div className="relative aspect-[4/3] w-[74%] sm:w-[min(86%,380px)]">
          {fan.map(({ cover, offset }) => (
            <PhoneFrame
              key={offset}
              className="absolute bottom-0 left-[33%] w-[34%] origin-[50%_120%] shadow-[0_24px_40px_-24px_rgba(0,0,0,0.45)] transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none [transform:var(--rest)] group-hover:[transform:var(--open)] group-focus-visible:[transform:var(--open)] group-data-[open]:[transform:var(--open)]"
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
            className="display-head text-[clamp(32px,3.4vw,48px)] text-ink"
          >
            {pack.name}
          </m.h3>
          <p className="m-0 mt-2 font-sans text-[14px] leading-snug text-ink-dim">{pack.tagline}</p>
          <ul className="m-0 mt-4 flex list-none flex-wrap gap-1.5 p-0">
            <Tag>{describeContents(pack)}</Tag>
            {isPhoneAndDesktop(pack) && <Tag>Phone + desktop</Tag>}
            <Tag>4K · 5K</Tag>
          </ul>
        </div>
        <span className="shrink-0 rounded-sharp bg-ink px-3 py-1.5 font-sans text-[14px] font-semibold text-bg">
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
    <li className="rounded-sharp border border-ink/30 px-2 py-0.5 font-sans text-[12px] font-medium text-ink-dim">
      {children}
    </li>
  );
}
