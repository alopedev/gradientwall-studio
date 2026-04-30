import { Link } from "react-router-dom";
import type { Pack } from "@/lib/packs";
import { PackCover } from "./PackCover";

interface PackCardProps {
  pack: Pack;
  /**
   * Bento role of this card. `"hero"` is the 2×2 flagship slot — larger
   * typography, more dramatic copy, an animated accent beam riding the
   * border on hover. `"small"` is the satellite slot — compact, lift on
   * hover. Defaults to `"small"`.
   */
  variant?: "hero" | "small";
}

export function PackCard({ pack, variant = "small" }: PackCardProps) {
  const isHero = variant === "hero";
  return (
    <Link
      to={`/packs/${pack.slug}`}
      className="group relative block h-full rounded-[2px] overflow-hidden bg-[#0a0a0d] border border-white/8 transition-[border-color,transform,box-shadow] duration-300 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
      data-variant={variant}
    >
      <div className="relative h-full overflow-hidden bg-black">
        <PackCover
          cover={pack.cover}
          w={isHero ? 1200 : 720}
          h={isHero ? 1200 : 960}
          className="block w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {/* Legibility scrim — gradient from black at bottom up to transparent
            so the headline + tagline stay readable on any cover. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(7,7,10,0.92) 0%, rgba(7,7,10,0.55) 38%, rgba(7,7,10,0) 100%)",
          }}
        />

        {/* Top chips: style left, price right. Same on both variants. */}
        <div className="absolute top-3.5 left-3.5 z-10 rounded-full bg-black/55 border border-white/14 px-2.5 py-1 font-sans text-[10px] tracking-[0.18em] uppercase text-white/85 backdrop-blur-md">
          {pack.style}
        </div>
        <div className="absolute top-3.5 right-3.5 z-10 rounded-[2px] bg-white/95 text-[#0a0a0d] px-2.5 py-1 font-sans text-[11px] font-medium tracking-tight">
          €{pack.priceEur.toFixed(2)}
        </div>

        {/* Bottom-anchored typography. Hero variant scales up considerably
            — that's the whole point of the asymmetric Bento. */}
        <div
          className={`absolute inset-x-0 bottom-0 z-10 ${
            isHero ? "p-7 md:p-9" : "p-4"
          }`}
        >
          <h3
            className={`display-head text-white leading-[0.95] m-0 ${
              isHero ? "text-[clamp(28px,3.6vw,52px)]" : "text-[20px]"
            }`}
          >
            {pack.name}
          </h3>
          <p
            className={`m-0 font-serif italic text-white/80 leading-snug ${
              isHero ? "mt-3 text-[clamp(15px,1.4vw,20px)]" : "mt-1.5 text-[14px]"
            }`}
          >
            {pack.tagline}
          </p>
          <div
            className={`font-sans tracking-[0.2em] uppercase text-white/50 ${
              isHero ? "mt-5 text-[10px]" : "mt-2.5 text-[10px]"
            }`}
          >
            {pack.previews.length} wallpapers · max resolution
            {isHero && <span className="ml-2 text-white/30">·</span>}
            {isHero && <span className="ml-2 text-white/65">view pack →</span>}
          </div>
        </div>

        {/* Animated accent beam riding the border on hover — hero only,
            since it's loud and only earns its keep on the flagship slot. */}
        {isHero && <BorderBeam />}
      </div>
    </Link>
  );
}

/**
 * Conic-gradient beam that traces the card border on hover. Implementation:
 * a 2×-scaled square positioned absolute, spinning behind a 1px-inset
 * black mask. The user sees a single bright slice ride the perimeter.
 */
function BorderBeam() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[2px] overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100"
    >
      <span
        className="absolute left-1/2 top-1/2 aspect-square w-[180%] motion-safe:animate-[gw-beam-spin_3.5s_linear_infinite]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.95) 6%, rgba(255,59,48,0.65) 9%, transparent 18%, transparent 100%)",
        }}
      />
      {/* Inner mask — leaves only ~1px around the border visible. */}
      <span className="absolute inset-px rounded-[2px] bg-[#0a0a0d]" />
    </span>
  );
}
