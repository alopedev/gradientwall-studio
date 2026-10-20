import { STUDIO_NOT_AI } from "@/lib/copy";
import { EmailCapture } from "../../EmailCapture";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Reveal } from "../../ui/Reveal";
import { useConfigStore } from "@/store";
import { DeviceStage } from "./DeviceStage";
import { FavoritesStrip } from "./FavoritesStrip";
import { type RevealRequest, RevealContext } from "./reveal";
import { StudioInspector } from "./StudioInspector";
import { StudioTopBar } from "./StudioTopBar";
import { PAGE_COLUMN } from "@/components/ui/layout";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * The full Studio, after the hero and the packs: a short pitch on the left,
 * then the Studio frame: the wallpaper inside a phone, tablet or monitor with
 * the saved wallpapers under it, and a panel beside it holding every control
 * (StudioInspector). Shuffle (or Space) is the main gesture. On narrow screens
 * the pitch stacks above the frame and the panel drops under the wallpaper.
 */
export function StudioShell() {
  const device = useConfigStore((s) => s.device);
  const sectionRef = useRef<HTMLElement>(null);
  const revealRef = useRef<RevealRequest | null>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });
  // The Studio sits in the middle of the page, so Space must keep scrolling it
  // until the visitor is actually using it: keys only act while the pointer is
  // over the frame or focus is inside it.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <RevealContext.Provider value={revealRef}>
      <section ref={sectionRef} className="relative isolate overflow-hidden border-t border-ink">
        <div
          className={`${PAGE_COLUMN} grid gap-8 pb-[clamp(32px,5vw,72px)] pt-[clamp(48px,6vw,88px)] lg:min-h-[100svh] lg:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.6fr)] lg:items-center lg:gap-10`}
        >
          <Reveal className="relative z-[1]">
            <h2 className="display-head text-[clamp(40px,4.6vw,76px)] text-ink">
              shuffle, tweak, download.
            </h2>
            <p className="mt-5 hidden max-w-[40ch] font-sans text-[15px] text-ink-dim md:block">
              Press Shuffle (or Space) until one feels right. Change the style, the palette or any
              single colour, then download it at the exact size of your screen.
            </p>
          </Reveal>

          {/* Anchor target: "Open the Studio" lands on the frame (just under the nav). */}
          <div id="studio" className="@container mx-auto w-full max-w-[1500px] scroll-mt-[76px]">
            <div
              data-device={device}
              onPointerEnter={() => setHovered(true)}
              onPointerLeave={() => setHovered(false)}
              onFocusCapture={() => setFocused(true)}
              onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
              }}
              className="relative isolate grid h-[clamp(620px,calc(100svh_-_150px),860px)] grid-cols-[minmax(0,1fr)_300px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-sharp border-2 border-ink bg-bg-2 [grid-template-areas:'top_panel''stage_panel''saved_panel'] @max-[760px]:h-auto @max-[760px]:grid-cols-1 @max-[760px]:grid-rows-[auto_clamp(300px,calc(100svh_-_440px),520px)_auto_auto] @max-[760px]:[grid-template-areas:'top''stage''panel''saved'] @max-[760px]:data-[device=desktop]:grid-rows-[auto_330px_auto_auto]"
            >
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
            <p className="m-0 mt-5 text-center font-sans text-[11px] tracking-[0.04em] text-ink-dim">
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
