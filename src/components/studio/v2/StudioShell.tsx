import { STUDIO_NOT_AI } from "@/lib/copy";
import { EmailCapture } from "../../EmailCapture";
import { m, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "../../ui/Reveal";
import { useConfigStore } from "@/store";
import { DeviceStage } from "./DeviceStage";
import { FavoritesStrip } from "./FavoritesStrip";
import { type RevealRequest, RevealContext } from "./reveal";
import { HeroAmbient } from "./HeroAmbient";
import { StageHalo } from "./StageHalo";
import { StudioDock } from "./StudioDock";
import { StudioTopBar } from "./StudioTopBar";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * The first screen of the site and the Studio in one: the pitch on the left,
 * the wallpaper inside a phone, tablet or monitor frame on the right with one
 * glass dock holding every control, and the saved wallpapers underneath.
 * Shuffle (or Space) is the main gesture; everything finer sits behind Adjust.
 * On narrow screens the pitch stacks above the frame.
 */
export function StudioShell() {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const device = useConfigStore((s) => s.device);
  const sectionRef = useRef<HTMLElement>(null);
  const revealRef = useRef<RevealRequest | null>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });
  // The Studio is now the first screen, so Space must keep scrolling the page
  // until the visitor is actually using it: keys only act while the pointer is
  // over the frame or focus is inside it.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // Escape closes Adjust (unless the key is going to a text field).
  useEffect(() => {
    if (!adjustOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      setAdjustOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adjustOpen]);

  return (
    <RevealContext.Provider value={revealRef}>
      <section ref={sectionRef} className="relative isolate overflow-hidden">
        <HeroAmbient />
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
              data-device={device}
              onPointerEnter={() => setHovered(true)}
              onPointerLeave={() => setHovered(false)}
              onFocusCapture={() => setFocused(true)}
              onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
              }}
              className="relative isolate grid h-[clamp(560px,calc(100svh_-_210px),840px)] grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden rounded-[20px] border border-white/10 bg-[radial-gradient(120%_90%_at_50%_40%,#0d0d11_0%,#060607_70%)] @max-[760px]:h-auto @max-[760px]:grid-rows-[auto_clamp(300px,calc(100svh_-_440px),520px)_auto_auto] @max-[760px]:rounded-2xl @max-[760px]:data-[device=desktop]:grid-rows-[auto_330px_auto_auto]"
            >
              <StageHalo />
              <m.div {...enter(0)}>
                <StudioTopBar />
              </m.div>
              <m.div
                {...enter(0.05)}
                className="relative z-[1] grid min-h-0 place-items-center px-6 pb-11 pt-2 [container-type:size] @max-[760px]:px-4 @max-[760px]:pb-[34px]"
              >
                <DeviceStage />
              </m.div>
              <m.div
                {...enter(0.18)}
                className="relative z-[4] -mt-[26px] grid @max-[760px]:-mt-[22px]"
              >
                <StudioDock
                  adjustOpen={adjustOpen}
                  onToggleAdjust={() => setAdjustOpen((o) => !o)}
                  keysActive={inView && (hovered || focused)}
                />
              </m.div>
              <m.div {...enter(0.3)}>
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
