import { useEffect, useState, type ReactNode } from "react";

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
  const now = useLocalTime();

  return (
    <section className="relative h-screen min-h-[720px] overflow-hidden isolate bg-[color:var(--color-bg)]">
      {/* Full-bleed gradient video — the visual anchor of the page. */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-[1]"
        src="/assets/backgroundVideos/gradientBackground_loop.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
        style={{ filter: "brightness(0.82) saturate(1.05)" }}
      />

      {/* Vignette: darken the corners so the white headline + chrome stay legible
          regardless of which frame of the looping gradient is on screen. The
          centre keeps full color. */}
      <div
        aria-hidden
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(7,7,10,0) 0%, rgba(7,7,10,0.45) 70%, rgba(7,7,10,0.75) 100%)",
        }}
      />

      <h1 className="absolute top-[clamp(80px,12vh,160px)] left-[clamp(24px,7vw,120px)] right-[clamp(24px,7vw,120px)] z-[3] m-0 font-sans font-bold uppercase tracking-[-0.045em] leading-[0.9] text-[color:var(--color-ink)] text-[clamp(56px,10vw,140px)]">
        <span className="block">Color,</span>
        <span className="block">by design.</span>
      </h1>

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
