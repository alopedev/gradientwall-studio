import type { ReactNode } from "react";
import { glassButton } from "./ui/GlassButton";
import { MagneticButton } from "./ui/MagneticButton";

export function Hero() {
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
        <span className="block">Make your own</span>
        <span className="block">
          gradient{" "}
          <span className="font-serif italic font-normal normal-case tracking-tight">
            wallpaper.
          </span>
        </span>
      </h1>

      {/* Stacked on narrow screens so the stamp never runs under the button. */}
      <div className="absolute inset-x-[clamp(24px,7vw,120px)] bottom-[clamp(40px,8vh,96px)] z-[3] flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <Stamp>
          <span>Free · No account · No watermark</span>
        </Stamp>
        <MagneticButton>
          <a href="#studio" className={`${glassButton({ variant: "primary" })} px-6`}>
            Make a wallpaper
            <span aria-hidden>→</span>
          </a>
        </MagneticButton>
      </div>
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
      className={`stamp inline-flex items-center gap-2 px-3 py-1.5 font-sans text-[10px] md:text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-ink-75)] whitespace-nowrap ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
