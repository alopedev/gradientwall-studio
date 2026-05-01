import { Reveal } from "./ui/Reveal";

const ITEMS = [
  "Mesh gradients",
  "Organic blobs",
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
            {t}
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                accentDot ? "bg-[color:var(--color-accent)]" : "bg-white/20"
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
