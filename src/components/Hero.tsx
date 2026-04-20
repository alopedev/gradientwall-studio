import { useEffect, useState, type ReactNode } from "react";
import { useConfigStore } from "@/store";
import { seedToHex } from "@/lib/gradient";

// Horizontal anchors inside the specimen box. The marker's x is where the
// blueprint line starts; the stamp sits just past the specimen's right edge.
const MARKER_X = 72;
const STAMP_OFFSET = 40;

// Hoisted so the identical style object isn't re-allocated on every render
// of the (frequently re-rendered) Hero tree.
const VIDEO_STYLE: React.CSSProperties = {
  // Crush the source's near-black floor so any surviving pixels outside the
  // mask ellipse fall into the page bg instead of reading as a grey box.
  filter: "contrast(1.2) brightness(0.88)",
  maskImage: "radial-gradient(ellipse 42% 54% at 50% 56%, black 52%, transparent 86%)",
  WebkitMaskImage: "radial-gradient(ellipse 42% 54% at 50% 56%, black 52%, transparent 86%)",
};

const MARKER_STYLE: React.CSSProperties = {
  top: "50%",
  left: `${MARKER_X}%`,
  transform: "translate(-50%, -50%)",
  background: "var(--color-accent)",
  boxShadow: "0 0 0 2px rgba(7,7,10,0.85)",
};

const HAIRLINE_STYLE: React.CSSProperties = {
  top: "50%",
  left: `${MARKER_X}%`,
  width: `calc(${100 - MARKER_X}% + ${STAMP_OFFSET}px)`,
  background: "rgb(255 255 255 / 0.45)",
};

function useLocalTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Minute cadence — the visible format is HH:MM.
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
      <h1 className="absolute top-[clamp(80px,12vh,160px)] left-[clamp(24px,7vw,120px)] right-[clamp(24px,7vw,120px)] z-[3] m-0 font-sans font-bold uppercase tracking-[-0.045em] leading-[0.9] text-[color:var(--color-ink)] text-[clamp(56px,10vw,140px)]">
        <span className="block">Color,</span>
        <span className="block">by design.</span>
      </h1>

      <SpecimenGroup seedHex={seedToHex(seed)} />

      <Stamp className="top-[clamp(80px,10vh,120px)] right-[clamp(24px,7vw,120px)] z-[3]">
        <PulseDot />
        <span>Local time</span>
        <span className="text-[color:var(--color-ink)]">{formatHHMM(now)}</span>
      </Stamp>
      <Stamp className="bottom-[clamp(40px,8vh,96px)] left-[clamp(24px,7vw,120px)] z-[3]">
        <span>∞ Gradients · 0 presets</span>
      </Stamp>

      <a
        href="#studio"
        className="group absolute z-[3] bottom-[clamp(40px,8vh,96px)] right-[clamp(24px,7vw,120px)] inline-flex items-center gap-3 font-sans text-[12px] md:text-[13px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-ink)] transition-colors duration-150"
      >
        <span className="border-b border-transparent group-hover:border-[color:var(--color-accent)] pb-1 transition-colors duration-150">
          Open the studio
        </span>
        <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>
      </a>
    </section>
  );
}

function SpecimenGroup({ seedHex }: { seedHex: string }) {
  return (
    <div
      className="absolute z-[2] left-1/2"
      style={{
        top: "calc(50% - 2vh)",
        // One `transform` declaration — absorbs the X centering that would
        // otherwise come from `-translate-x-1/2`.
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="relative"
        style={{ width: "min(65vw, 108vh)", aspectRatio: "16 / 9" }}
      >
        <video
          className="absolute inset-0 w-full h-full object-contain"
          src="/assets/backgroundVideos/specimenGem_loop.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
          style={VIDEO_STYLE}
        />
        <span aria-hidden className="absolute z-[2] h-[6px] w-[6px]" style={MARKER_STYLE} />
        <span aria-hidden className="absolute hidden md:block z-[1] h-px" style={HAIRLINE_STYLE} />
        <Stamp
          className="z-[2]"
          style={{
            top: "50%",
            left: `calc(100% + ${STAMP_OFFSET}px)`,
            transform: "translateY(-50%)",
          }}
        >
          <span>Render</span>
          <span className="text-[color:var(--color-ink)]">{seedHex}</span>
        </Stamp>
      </div>
    </div>
  );
}

/**
 * Technical sticker chrome — hairline border + tinted backdrop-blur. The
 * CSS lives in `@utility stamp` (see index.css); this component only adds
 * the positioning hook and the typography defaults.
 */
function Stamp({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={`stamp absolute inline-flex items-center gap-2 px-3 py-1.5 font-sans text-[10px] md:text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-ink-75)] whitespace-nowrap ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function PulseDot() {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rounded-full motion-safe:animate-pulse"
      style={{
        background: "var(--color-accent)",
        boxShadow: "0 0 8px var(--color-accent)",
      }}
    />
  );
}
