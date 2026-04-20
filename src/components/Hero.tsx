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

      {/* Specimen frame — 4:5 portrait crop of the 16:9 video, centered in
          the lower-half. The video is cropped by object-cover keeping the
          hot center of the gradient. */}
      <SpecimenFrame />

      {/* Meta stamps */}
      <Stamp
        variant="top-right"
        label="LOCAL TIME"
        value={formatHHMM(now)}
        pulseDot
      />
      <Stamp variant="mid-right" label="RENDER" value={seedToHex(seed)} />
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
 * 4:5 portrait crop of the 16:9 gradient video. Soft inner vignette fades
 * the edges of the video into the surrounding dark bg so the frame reads
 * as an isolated specimen rather than a hard-matted window.
 */
function SpecimenFrame() {
  return (
    <div
      className="absolute z-[2] left-1/2 -translate-x-1/2 bottom-[clamp(140px,16vh,220px)]"
      style={{
        width: "min(32vw, 44vh)",
        aspectRatio: "4 / 5",
      }}
    >
      {/* Video + vignette live in an inner overflow-hidden wrapper so the
          rounded corners clip the video cleanly. The blueprint annotation
          (marker + line) sits OUTSIDE this wrapper so the hairline can
          extend past the specimen edge without being clipped. */}
      <div className="relative w-full h-full overflow-hidden rounded-[2px]">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/assets/backgroundVideos/gradientBackground2.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
        {/* Inner vignette — fades the video edges to the surrounding dark. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(80% 80% at 50% 50%, transparent 55%, rgba(7,7,10,0.6) 100%)",
          }}
        />
      </div>
      {/* Square marker — visually on the specimen (same 10%/10% offset as
          it had when nested), but outside the overflow-hidden wrapper so
          the hairline that starts at it can extend past the frame. */}
      <span
        aria-hidden
        className="absolute top-[10%] right-[10%] h-[6px] w-[6px] z-[2]"
        style={{
          background: "var(--color-accent)",
          boxShadow: "0 0 0 2px rgba(7,7,10,0.85)",
        }}
      />
      {/* Blueprint hairline — thin white line from the marker's right edge
          extending rightward toward the RENDER stamp in the right gutter.
          Hidden on narrow viewports where the stamp wraps above the
          specimen. Fixed width in vw — any longer than the gutter distance
          just runs under the stamp, which is fine (the stamp has its own
          bg that masks the line end). */}
      <span
        aria-hidden
        className="absolute hidden md:block h-px z-[1]"
        style={{
          top: "calc(10% + 2px)",
          left: "calc(90% + 10px)",
          width: "26vw",
          background: "rgb(255 255 255 / 0.45)",
        }}
      />
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
