import { STUDIO_NOT_AI } from "@/lib/copy";
import { EmailCapture } from "../../EmailCapture";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Reveal } from "../../ui/Reveal";
import { useConfigStore } from "@/store";
import { DeviceStage } from "./DeviceStage";
import { FavoritesStrip } from "./FavoritesStrip";
import { type RevealRequest, RevealContext } from "./reveal";
import { HeroAmbient } from "./HeroAmbient";
import { HeroBackdrop } from "./HeroBackdrop";
import { StageHalo } from "./StageHalo";
import { StudioInspector } from "./StudioInspector";
import { StudioTopBar } from "./StudioTopBar";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * The first screen of the site and the Studio in one: the pitch on the left,
 * then the Studio frame: the wallpaper inside a phone, tablet or monitor with
 * the saved wallpapers under it, and a panel beside it holding every control
 * (StudioInspector). Shuffle (or Space) is the main gesture. On narrow screens
 * the pitch stacks above the frame and the panel drops under the wallpaper.
 */
export function StudioShell() {
  const device = useConfigStore((s) => s.device);
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<RevealRequest | null>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });
  // The Studio is now the first screen, so Space must keep scrolling the page
  // until the visitor is actually using it: keys only act while the pointer is
  // over the frame or focus is inside it.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <RevealContext.Provider value={revealRef}>
      <section ref={sectionRef} className="relative isolate overflow-hidden">
        <HeroAmbient />
        <HeroBackdrop occluderRef={frameRef} />
        <div className="mx-auto grid max-w-[1600px] gap-8 px-[clamp(16px,4vw,64px)] pb-[clamp(32px,5vw,72px)] pt-[88px] lg:min-h-[100svh] lg:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.6fr)] lg:items-center lg:gap-10 lg:pt-[96px]">
          <Reveal className="relative z-[1]">
            <span className="mb-5 hidden rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-white/75 md:inline-flex">
              Free · No account · No watermark
            </span>
            <h1 className="m-0 font-sans text-[clamp(40px,4.6vw,76px)] font-bold uppercase leading-[0.92] tracking-[-0.045em] text-white">
              Make your own gradient <span className="serif-accent">wallpaper.</span>
            </h1>
            <p className="mt-5 hidden max-w-[40ch] font-sans text-[15px] font-light text-white/75 md:block">
              Press Shuffle (or Space) until one feels right. Change the style or the colors, then
              download it sharp, up to 5120 × 2880. Free, no account, no watermark.
            </p>
          </Reveal>

          {/* Anchor target: "Make a wallpaper" lands on the frame (just under the nav). */}
          <div id="studio" className="@container mx-auto w-full max-w-[1500px] scroll-mt-[76px]">
            <div
              ref={frameRef}
              data-device={device}
              onPointerEnter={() => setHovered(true)}
              onPointerLeave={() => setHovered(false)}
              onFocusCapture={() => setFocused(true)}
              onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
              }}
              className="relative isolate grid h-[clamp(620px,calc(100svh_-_150px),860px)] grid-cols-[minmax(0,1fr)_300px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[20px] border border-white/10 bg-[radial-gradient(120%_90%_at_50%_40%,#0d0d11_0%,#060607_70%)] [grid-template-areas:'top_panel''stage_panel''saved_panel'] @max-[760px]:h-auto @max-[760px]:grid-cols-1 @max-[760px]:grid-rows-[auto_clamp(300px,calc(100svh_-_440px),520px)_auto_auto] @max-[760px]:rounded-2xl @max-[760px]:[grid-template-areas:'top''stage''panel''saved'] @max-[760px]:data-[device=desktop]:grid-rows-[auto_330px_auto_auto]"
            >
              <StageHalo />
              <m.div {...enter(0)} className="[grid-area:top]">
                <StudioTopBar />
              </m.div>
              <m.div
                {...enter(0.05)}
                className="relative z-[1] grid min-h-0 place-items-center px-6 pb-4 pt-2 [container-type:size] [grid-area:stage] @max-[760px]:px-4 @max-[760px]:pb-5"
              >
                <DeviceStage />
              </m.div>
              <StudioInspector keysActive={inView && (hovered || focused)} />
              <m.div {...enter(0.3)} className="min-w-0 [grid-area:saved]">
                <FavoritesStrip />
              </m.div>
            </div>
            <p className="m-0 mt-5 text-center font-sans text-[11px] tracking-[0.04em] text-white/55">
              {STUDIO_NOT_AI}
            </p>
            <EmailCapture
              source="studio"
              heading="Like these? Get new wallpapers and packs first."
              className="relative mx-auto mt-10 max-w-[520px]"
            />
          </div>
        </div>
      </section>
    </RevealContext.Provider>
  );
}
