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

function Track() {
  return (
    <span className="inline-flex items-center gap-14">
      {ITEMS.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-14">
          {t}
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/20" aria-hidden />
        </span>
      ))}
    </span>
  );
}

export function Marquee() {
  return (
    <Reveal>
      <div
        className="overflow-hidden whitespace-nowrap py-6 border-y border-white/8"
        style={{ background: "var(--color-bg-2)" }}
        aria-hidden
      >
        <div
          className="inline-flex gap-14 font-sans font-medium uppercase tracking-[0.18em] text-[14px] text-white/70"
          style={{ animation: "gw-scroll-left 40s linear infinite" }}
        >
          <Track />
          <Track />
        </div>
      </div>
    </Reveal>
  );
}
