import { prefersReducedMotion } from "@/lib/motion";
import { type CSSProperties, type MouseEvent, useRef } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { packPath } from "@/lib/seo/pages";
import { useInView } from "motion/react";
import { isPlainClick, runPageTransition } from "@/lib/page-transition";
import { isPhoneAndDesktop, type Pack } from "@/lib/packs";
import { fanPieces } from "@/lib/packs/showcase";
import { LockScreen, PhoneFrame } from "./DeviceFrames";
import { PackCover } from "./PackCover";

const FILL = "absolute inset-0 block h-full w-full object-cover";

/**
 * Catalog card: the pack as a stack of phones over its own blurred colours.
 * Hover or keyboard focus fans the stack open to show the designs inside; on
 * touch screens (no hover) it opens once the card is on screen. Opening the
 * pack morphs the front phone and the name into the pack page (A1).
 */
export function PackCard({ pack }: { pack: Pack }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const open = inView && !canHover();
  const fan = fanPieces(pack);
  const price = `€${pack.priceEur.toFixed(2)}`;
  const to = packPath(pack.slug);
  const navigate = useNavigate();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const doc = document as Document & { startViewTransition?: unknown };
    if (!isPlainClick(e) || typeof doc.startViewTransition !== "function") return;
    e.preventDefault();
    const card = e.currentTarget;
    void runPageTransition({
      update: () => flushSync(() => navigate(to)),
      ready: () => document.querySelector(PACK_PAGE_PHONE) !== null,
      reducedMotion: prefersReducedMotion(),
      shared: [
        {
          name: "pack-phone",
          source: card.querySelector("[data-vt-src=phone]"),
          dest: PACK_PAGE_PHONE,
        },
        { name: "pack-title", source: card.querySelector("h3"), dest: "[data-vt=pack-title]" },
      ],
    });
  };

  return (
    <Link
      ref={ref}
      to={to}
      onClick={onClick}
      data-pack-card={pack.slug}
      data-open={open || undefined}
      className="group relative flex h-full min-h-[500px] flex-col overflow-hidden rounded-sharp border-2 border-ink bg-bg-2 transition-colors duration-300 hover:bg-[#cfcec9]"
    >
      <div className="relative z-10 flex flex-1 items-end justify-center px-6 pt-16 pb-6">
        <div className="relative aspect-[4/3] w-[74%] sm:w-[min(86%,380px)]">
          {fan.map(({ cover, offset }) => (
            <PhoneFrame
              key={offset}
              className="absolute bottom-0 left-[33%] w-[34%] origin-[50%_120%] shadow-[0_24px_40px_-24px_rgba(0,0,0,0.45)] transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none [transform:var(--rest)] group-hover:[transform:var(--open)] group-focus-visible:[transform:var(--open)] group-data-[open]:[transform:var(--open)]"
              style={fanStyle(offset)}
              data-vt-src={offset === 0 ? "phone" : undefined}
            >
              <PackCover
                cover={cover}
                w={480}
                h={1040}
                box={[160, 300]}
                className={FILL}
                decorative={offset !== 0}
              />
              {offset === 0 && <LockScreen />}
            </PhoneFrame>
          ))}
        </div>
      </div>

      <div className="relative z-10 p-5 sm:p-6">
        <h3 className="display-head w-fit text-[clamp(32px,3.4vw,48px)] text-ink">{pack.name}</h3>
        <p className="m-0 mt-2 font-sans text-[16px] leading-snug text-ink-dim">{pack.tagline}</p>
        <ul className="m-0 mt-2 flex list-none flex-wrap p-0 font-sans text-[14px] text-ink-dim [&>li+li]:before:px-1.5 [&>li+li]:before:content-['·']">
          <li>{designCount(pack.previews.length)}</li>
          {isPhoneAndDesktop(pack) && <li>Phone + desktop</li>}
          <li>Up to 5K</li>
        </ul>
        <div className="mt-4 flex items-center justify-between gap-4 border-t-2 border-ink pt-4">
          <p className="m-0 grid font-sans">
            <span className="text-[20px] font-semibold text-ink">{price}</span>
            {pack.etsyUrl && <span className="text-[13px] text-ink-dim">sold on Etsy</span>}
          </p>
          {/* The whole card is the link; this only shows where it leads. */}
          <span className="inline-flex min-h-11 shrink-0 items-center rounded-sharp bg-ink px-4 font-sans text-[15px] font-semibold text-bg transition-colors group-hover:bg-ink/85">
            See the pack →
          </span>
        </div>
      </div>
    </Link>
  );
}

/** The pack page's phone, where the card's front phone lands. */
const PACK_PAGE_PHONE = "[data-vt=pack-phone]";

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

/** "10 designs", "1 design". */
function designCount(n: number): string {
  return `${n} ${n === 1 ? "design" : "designs"}`;
}
