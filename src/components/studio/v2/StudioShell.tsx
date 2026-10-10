import { m, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "../../ui/Reveal";
import { SplitWords } from "../../ui/SplitWords";
import { useConfigStore } from "@/store";
import { DeviceStage } from "./DeviceStage";
import { FavoritesStrip } from "./FavoritesStrip";
import { type RevealRequest, RevealContext } from "./reveal";
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
 * Studio: the wallpaper inside a phone, tablet or monitor frame, one glass dock
 * with every control, and the saved wallpapers underneath. Shuffle (or Space)
 * is the main gesture; everything finer sits behind Adjust.
 */
export function StudioShell() {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const device = useConfigStore((s) => s.device);
  const sectionRef = useRef<HTMLElement>(null);
  const revealRef = useRef<RevealRequest | null>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });

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
      <section
        ref={sectionRef}
        id="studio"
        className="relative mx-auto max-w-[1600px] px-[clamp(16px,5vw,80px)] py-[clamp(60px,9vw,120px)]"
      >
        <Reveal className="mb-8 grid items-end gap-6 md:mb-10 md:grid-cols-2 md:gap-12">
          <div>
            <span className="mb-4 block font-sans text-[11px] uppercase tracking-[0.22em] text-white/40">
              02 — The studio
            </span>
            <h2 className="m-0 font-sans text-[clamp(40px,5.5vw,76px)] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-white">
              <SplitWords text="One tap. Done." kinetic />
            </h2>
          </div>
          <p className="max-w-[42ch] font-sans text-[15px] font-light text-white/75">
            Hit Shuffle, or press Space, and a wallpaper appears. Pick a style or a palette, open
            Adjust for the fine controls, and download it sized for your phone, tablet or desktop.
          </p>
        </Reveal>

        <div className="@container mx-auto max-w-[1500px]">
          <div
            data-device={device}
            className="relative isolate grid h-[clamp(700px,92vh,860px)] grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden rounded-[20px] border border-white/10 bg-[radial-gradient(120%_90%_at_50%_40%,#0d0d11_0%,#060607_70%)] @max-[760px]:h-auto @max-[760px]:grid-rows-[auto_520px_auto_auto] @max-[760px]:rounded-2xl @max-[760px]:data-[device=desktop]:grid-rows-[auto_330px_auto_auto]"
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
                keysActive={inView}
              />
            </m.div>
            <m.div {...enter(0.3)}>
              <FavoritesStrip />
            </m.div>
          </div>
        </div>
      </section>
    </RevealContext.Provider>
  );
}
