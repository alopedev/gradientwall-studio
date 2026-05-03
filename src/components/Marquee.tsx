import { Reveal } from "./ui/Reveal";

const ITEMS = [
  "Mesh gradients",
  "Aurora curtains",
  "Soft grain",
  "Four colors",
  "Zero limits",
  "Mobile · Desktop · Tablet",
  "Made in ∞ hours",
];

/**
 * Continuous-scroll editorial banner under the Hero. Two passes of the
 * `Track` are concatenated and translated by -50% so the loop is seamless.
 *
 * Refinements:
 *  - Edge fade masks (`mask-image`) so the text dissolves at the rail
 *    boundaries instead of clipping abruptly.
 *  - Pause on hover via `group-hover:[animation-play-state:paused]`.
 *  - Every 3rd separator dot uses the accent color, giving the rail a
 *    rhythmic chromatic beat instead of uniform grey.
 */
function Track() {
  return (
    <span className="inline-flex items-center gap-14">
      {ITEMS.map((t, i) => {
        const accentDot = i % 3 === 2;
        return (
          <span key={i} className="inline-flex items-center gap-14">
            <span
              className="inline-block transition-[transform,color,text-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:text-white hover:[text-shadow:0_0_18px_rgba(255,59,48,0.35)]"
            >
              {t}
            </span>
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full transition-transform duration-300 ${
                accentDot
                  ? "bg-[color:var(--color-accent)] hover:scale-[1.6] hover:shadow-[0_0_10px_rgba(255,59,48,0.7)]"
                  : "bg-white/20 hover:bg-white/55 hover:scale-[1.4]"
              }`}
              aria-hidden
            />
          </span>
        );
      })}
    </span>
  );
}

export function Marquee() {
  return (
    <Reveal>
      <div
        className="group overflow-hidden whitespace-nowrap py-6 border-y border-white/8"
        style={{
          background: "var(--color-bg-2)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        }}
        aria-hidden
      >
        <div
          className="inline-flex gap-14 font-sans font-medium uppercase tracking-[0.18em] text-[14px] text-white/75 group-hover:[animation-play-state:paused]"
          style={{ animation: "gw-scroll-left 40s linear infinite" }}
        >
          <Track />
          <Track />
        </div>
      </div>
    </Reveal>
  );
}
