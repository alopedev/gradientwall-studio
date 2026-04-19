import { m } from "motion/react";
import { FADE_UP_INITIAL, fadeUpTransition } from "@/lib/motion";

// Entrance choreography — each element arrives with a ~120ms offset so the
// eye catches each word before the next claims attention.
const fadeUp = (delay: number) => ({
  initial: FADE_UP_INITIAL,
  animate: { opacity: 1, y: 0 },
  transition: fadeUpTransition(delay),
});

export function Hero() {
  return (
    <section className="relative h-screen min-h-[720px] overflow-hidden isolate">
      {/* Full-bleed video background — no color filters */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/assets/backgroundVideos/gradientBackground2.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
      />

      {/* Neutral (non-color) legibility layers on top of video */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(70% 60% at 50% 50%, rgba(7,7,10,0) 35%, rgba(7,7,10,0.55) 85%, rgba(7,7,10,0.95) 100%), linear-gradient(to bottom, rgba(7,7,10,0.25), rgba(7,7,10,0) 30%, rgba(7,7,10,0) 70%, rgba(7,7,10,0.9))",
        }}
      />
      <div
        className="absolute inset-0 z-[1] pointer-events-none hero-grain opacity-[0.45] mix-blend-overlay"
        aria-hidden
      />

      <div className="relative z-[2] h-full flex flex-col justify-center mx-auto max-w-[1600px] px-[clamp(24px,7vw,120px)] pt-24 md:pt-0 pb-[clamp(120px,18vh,250px)]">
        <m.span
          {...fadeUp(0.0)}
          className="inline-flex items-center gap-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-white/75 mb-7"
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#4dffb1]"
            style={{ boxShadow: "0 0 12px #4dffb1" }}
            aria-hidden
          />
          Vol. 04 — Spring edition · Live
        </m.span>

        <h1 className="m-0 mb-7 leading-[0.96] tracking-[-0.035em] text-[clamp(42px,7vw,64px)]">
          <m.span {...fadeUp(0.12)} className="block font-sans font-light text-white">
            Cinematic wallpapers,
          </m.span>
          <m.span {...fadeUp(0.24)} className="block font-serif italic text-white">
            mixed by hand.
          </m.span>
        </h1>

        <m.p
          {...fadeUp(0.4)}
          className="m-0 mb-10 max-w-[52ch] text-[clamp(15px,1.15vw,17px)] leading-[1.55] text-white/75 font-sans font-light"
        >
          A small studio for color. Blend four hues into mesh gradients, drifting blobs and soft grain — then pour
          them onto your phone, tablet or desktop in a single click.
        </m.p>

        <m.div {...fadeUp(0.55)} className="flex items-center gap-3.5 flex-wrap">
          <a
            href="#studio"
            className="inline-flex items-center gap-2 rounded-[2px] bg-[#f8f8f8] text-[#171717] px-5 py-3.5 text-sm font-sans font-medium tracking-[0.01em] transition-colors duration-150 hover:bg-white"
          >
            Open the studio <span className="transition-transform duration-150">→</span>
          </a>
          <a
            href="#gallery"
            className="inline-flex items-center gap-2 rounded-[2px] border border-white/35 text-white px-5 py-3.5 text-sm font-sans font-medium tracking-[0.01em] transition-colors duration-150 hover:bg-white/10 hover:border-white/55"
          >
            Browse the gallery
          </a>
        </m.div>
      </div>

      {/* Meta bottom row — bottom offset honors iOS home-indicator safe area so
          the text doesn't sit under the swipe-up gesture bar on modern iPhones. */}
      <div
        style={{ bottom: "max(24px, calc(env(safe-area-inset-bottom) + 12px))" }}
        className="absolute z-[2] md:bottom-9 flex justify-between items-end gap-4 left-[clamp(24px,7vw,120px)] right-[clamp(24px,7vw,120px)] font-sans text-[10px] md:text-[11px] tracking-[0.18em] uppercase text-white/55"
      >
        <div>
          <span className="md:hidden">GW / 2026</span>
          <span className="hidden md:inline">GW / 2026 — ∞ gradients, 0 presets required</span>
        </div>
        <div className="flex items-center gap-2.5 text-white/75 whitespace-nowrap">
          <span>Scroll to mix</span>
          <span className="relative h-px w-8 overflow-hidden bg-white/40">
            <span
              className="absolute inset-0 bg-white"
              style={{
                transform: "translateX(-100%)",
                animation: "gw-scroll-pulse 2.2s ease-in-out infinite",
              }}
            />
          </span>
        </div>
      </div>
    </section>
  );
}
