import { useRef } from "react";
import { Link } from "react-router-dom";
import { m, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
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

// Mouse-tracked tilt state. Cursor x/y are normalised to [-0.5, 0.5] relative
// to the card; springs smooth the readout so quick flicks don't snap. The
// small variant uses this to feel physical on hover; the hero owns the
// border-beam accent instead and stays flat to keep its typography stable.
function useTilt() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 20, mass: 0.4 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-8, 8]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  return { x, y, rotateX, rotateY };
}

export function PackCard({ pack, variant = "small" }: PackCardProps) {
  const isHero = variant === "hero";
  const tilt = useTilt();
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (isHero) return;
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    tilt.x.set((e.clientX - rect.left) / rect.width - 0.5);
    tilt.y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    if (isHero) return;
    tilt.x.set(0);
    tilt.y.set(0);
  };

  return (
    <Link
      ref={ref}
      to={`/packs/${pack.slug}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative block h-full rounded-[2px] overflow-hidden bg-[#0a0a0d] border border-white/8 transition-[border-color,box-shadow] duration-300 hover:border-white/20 hover:shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
      style={{ perspective: isHero ? undefined : "900px" }}
      data-variant={variant}
    >
      <TiltLayer isHero={isHero} rotateX={tilt.rotateX} rotateY={tilt.rotateY}>
        <div className="relative h-full overflow-hidden bg-black">
        <m.div layoutId={`pack-${pack.slug}-cover`} className="absolute inset-0">
          <PackCover
            cover={pack.cover}
            w={isHero ? 1200 : 720}
            h={isHero ? 1200 : 960}
            className="block w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </m.div>

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
          <m.h3
            layoutId={`pack-${pack.slug}-title`}
            className={`text-white leading-[0.95] m-0 ${
              isHero
                ? "font-serif italic font-normal text-[clamp(28px,3.6vw,52px)] tracking-tight"
                : "display-head text-[20px]"
            }`}
          >
            {isHero ? `${pack.name}.` : pack.name}
          </m.h3>
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
      </TiltLayer>
    </Link>
  );
}

/**
 * Wraps the card body in a layer that tilts on cursor move (small variant)
 * or stays flat (hero). Adds a small translate-up on group-hover that the
 * Link itself can no longer host now that the transform is delegated here.
 */
function TiltLayer({
  isHero,
  rotateX,
  rotateY,
  children,
}: {
  isHero: boolean;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  children: React.ReactNode;
}) {
  if (isHero) {
    return (
      <div className="h-full transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
        {children}
      </div>
    );
  }
  return (
    <m.div
      className="h-full will-change-transform transition-[translate] duration-300 ease-out group-hover:-translate-y-1"
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
    >
      {children}
    </m.div>
  );
}

/**
 * Conic-gradient beam that traces the card border on hover. Clipped to a
 * ~1.5px ring via mask-composite:exclude so the cover content underneath
 * stays fully visible (previous version used an opaque inner span which
 * blacked out image-kind covers).
 */
function BorderBeam() {
  const maskLayers = "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)";
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[2px] overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        padding: "1.5px",
        WebkitMask: maskLayers,
        WebkitMaskComposite: "xor",
        mask: maskLayers,
        maskComposite: "exclude",
      }}
    >
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square w-[180%] motion-safe:animate-[gw-beam-spin_3.5s_linear_infinite]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.95) 6%, rgba(255,59,48,0.65) 9%, transparent 18%, transparent 100%)",
        }}
      />
    </span>
  );
}
