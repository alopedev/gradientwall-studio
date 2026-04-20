import { useEffect, useState } from "react";
import { useConfigStore } from "@/store";
import { seedToHex } from "@/lib/gradient";

/**
 * Brutalist hero, Sutéra-inspired, dark-palette.
 *
 * Structure (see plan `hero-brutalist`):
 *   - Headline top-left: `COLOR, BY DESIGN.` in Space Grotesk 700 uppercase
 *     with ultra-tight tracking. Fills roughly the upper half of the viewport.
 *   - Specimen frame centered lower: 4:5 portrait crop of the gradient video
 *     — the video keeps playing inside. Soft inner-vignette fades the edges
 *     into the dark bg so the frame reads as "suspended sample", not "matted".
 *   - Three meta stamps in the corners: LOCAL TIME (live clock with a
 *     bermellón pulse dot), RENDER #SEED (tied to the current store seed via
 *     a thin SVG annotation line from a marker on the specimen), and
 *     ∞ GRADIENTS · 0 PRESETS (bottom-left slogan stamp).
 *   - Single minimal CTA: OPEN THE STUDIO → (no button background).
 *
 * Removed from the previous design: the descriptive paragraph, the second
 * "Browse the gallery" CTA, the "Vol. 04 — Spring edition · Live" indicator,
 * all italic-serif typography, and the fade-up entrance staggers (the video
 * inside the specimen provides the motion — the rest is a static poster).
 */

function useLocalTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Update once per minute — the visible granularity is HH:MM.
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function Hero() {
  const seed = useConfigStore((s) => s.seed);
  const now = useLocalTime();

  return (
    <section className="relative h-screen min-h-[720px] overflow-hidden isolate bg-[color:var(--color-bg)]">
      {/* Headline — top-left, dominates the upper half. Tracking ultra-tight;
          Space Grotesk 700 is the heaviest weight available. */}
      <h1
        className="absolute top-[clamp(80px,12vh,160px)] left-[clamp(24px,7vw,120px)] right-[clamp(24px,7vw,120px)] z-[3] m-0 font-sans font-bold uppercase tracking-[-0.045em] leading-[0.9] text-[color:var(--color-ink)] text-[clamp(56px,10vw,140px)]"
      >
        <span className="block">Color,</span>
        <span className="block">by design.</span>
      </h1>

      {/* Specimen group — floating 3D gem + blueprint annotation + RENDER
          stamp all in one flex wrapper so the three elements always align
          visually, no matter the viewport size. */}
      <SpecimenGroup seedHex={seedToHex(seed)} />

      {/* Meta stamps — the RENDER stamp travels with the specimen group
          above; these two stay anchored to hero corners. */}
      <Stamp
        variant="top-right"
        label="LOCAL TIME"
        value={formatHHMM(now)}
        pulseDot
      />
      <Stamp variant="bottom-left" label="∞ GRADIENTS · 0 PRESETS" />

      {/* Single CTA — bottom-left, no background, hover underline in accent. */}
      <a
        href="#studio"
        className="group absolute z-[3] bottom-[clamp(40px,8vh,96px)] right-[clamp(24px,7vw,120px)] inline-flex items-center gap-3 font-sans text-[12px] md:text-[13px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-ink)] transition-colors duration-150"
      >
        <span className="border-b border-transparent group-hover:border-[color:var(--color-accent)] pb-1 transition-colors duration-150">
          Open the studio
        </span>
        <span
          aria-hidden
          className="transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </a>
    </section>
  );
}

/**
 * Specimen group — iridescent 3D gem + blueprint annotation + RENDER stamp.
 *
 * Layout: a flex row that holds three visual tokens on a single invisible
 * baseline (items-center):
 *
 *   [ video (16:9, mask) ]  ── hairline ──  [ RENDER #SEED ]
 *
 * Because every child is aligned to flex-center, the marker inside the
 * video, the hairline, and the stamp all share the same vertical line at
 * every viewport width.
 *
 * The wrapper is absolutely centered in the hero (both axes with a small
 * upward bias so there's room for the CTA below). The video is sized to
 * the bigger of 68vw or 110vh (still under its 1920×1080 native, so no
 * resolution loss). A combination of `filter` (contrast up, brightness
 * down) and `mask-image` crushes the near-black source background into
 * the true page bg — the boxed-video rectangle disappears.
 */
function SpecimenGroup({ seedHex }: { seedHex: string }) {
  // Horizontal coordinates inside the specimen box (as %). The marker's x
  // is where the blueprint line starts; the stamp sits just past the
  // specimen's right edge. Hoisting them here keeps the three anchors in
  // one declaration so tweaks stay coherent.
  const MARKER_X = 72; // %: upper-right halo of the gem
  const STAMP_OFFSET = 40; // px: gap between specimen right edge and stamp

  return (
    <div
      className="absolute z-[2] left-1/2"
      style={{
        top: "calc(50% - 2vh)",
        // Single `transform` wins over Tailwind's translate — keep as one
        // declaration.
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Specimen — fixed size, aspect 16:9 preserved. All companion
          elements (marker, hairline, stamp) are absolutely positioned
          INSIDE this box so they share its coordinate system and align
          automatically without flex / grid gymnastics. */}
      <div
        className="relative"
        style={{
          width: "min(65vw, 108vh)",
          aspectRatio: "16 / 9",
        }}
      >
        <video
          className="absolute inset-0 w-full h-full object-contain"
          src="/assets/backgroundVideos/specimenGem.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
          style={{
            // Crush the source's near-black floor so it matches the page bg.
            filter: "contrast(1.2) brightness(0.88)",
            // Tight elliptical mask — preserve gem + halo, fade the rest.
            maskImage:
              "radial-gradient(ellipse 42% 54% at 50% 56%, black 52%, transparent 86%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 42% 54% at 50% 56%, black 52%, transparent 86%)",
          }}
        />

        {/* Marker — at (MARKER_X %, 50%) of the specimen. */}
        <span
          aria-hidden
          className="absolute z-[2] h-[6px] w-[6px]"
          style={{
            top: "50%",
            left: `${MARKER_X}%`,
            transform: "translate(-50%, -50%)",
            background: "var(--color-accent)",
            boxShadow: "0 0 0 2px rgba(7,7,10,0.85)",
          }}
        />

        {/* Blueprint hairline — starts AT the marker, travels right over
            the masked-out portion of the video and past the specimen edge
            to the stamp's left side. Because the specimen has no overflow
            clipping, the line can extend beyond its bounds. */}
        <span
          aria-hidden
          className="absolute hidden md:block z-[1] h-px"
          style={{
            top: "50%",
            left: `${MARKER_X}%`,
            width: `calc(${100 - MARKER_X}% + ${STAMP_OFFSET}px)`,
            background: "rgb(255 255 255 / 0.45)",
          }}
        />

        {/* RENDER stamp — glued to the right edge of the specimen, same
            vertical center as the marker. */}
        <div
          className="absolute z-[2] inline-flex items-center gap-2 px-3 py-1.5 font-sans text-[10px] md:text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-ink-75)] whitespace-nowrap"
          style={{
            top: "50%",
            left: `calc(100% + ${STAMP_OFFSET}px)`,
            transform: "translateY(-50%)",
            border: "1px solid rgb(255 255 255 / 0.18)",
            borderRadius: "2px",
            backgroundColor: "rgb(7 7 10 / 0.4)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span>Render</span>
          <span className="text-[color:var(--color-ink)]">{seedHex}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Corner-bracketed technical stamp. Minimal border on two corners (top-left
 * and bottom-right) suggesting a "stamped ticket" without a full box.
 */
function Stamp({
  variant,
  label,
  value,
  pulseDot = false,
}: {
  variant: "top-right" | "mid-right" | "bottom-left";
  label: string;
  value?: string;
  pulseDot?: boolean;
}) {
  const positionClass =
    variant === "top-right"
      ? "top-[clamp(80px,10vh,120px)] right-[clamp(24px,7vw,120px)]"
      : variant === "mid-right"
      ? "top-[40%] right-[clamp(24px,7vw,120px)]"
      : "bottom-[clamp(40px,8vh,96px)] left-[clamp(24px,7vw,120px)]";

  return (
    <div
      className={`absolute z-[3] ${positionClass} inline-flex items-center gap-2 px-3 py-1.5 font-sans text-[10px] md:text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-ink-75)]`}
      style={{
        // Corner brackets — two L-shapes via a linear-gradient trick would
        // be fragile. Use a simple 1px rounded-[2px] hairline border; it
        // reads as "technical sticker" in brutalist contexts.
        border: "1px solid rgb(255 255 255 / 0.18)",
        borderRadius: "2px",
        backgroundColor: "rgb(7 7 10 / 0.4)",
        backdropFilter: "blur(8px)",
      }}
    >
      {pulseDot && (
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full motion-safe:animate-pulse"
          style={{
            background: "var(--color-accent)",
            boxShadow: "0 0 8px var(--color-accent)",
          }}
        />
      )}
      <span>{label}</span>
      {value && <span className="text-[color:var(--color-ink)]">{value}</span>}
    </div>
  );
}
