import { useEffect, useState } from "react";
import { m } from "motion/react";
import { useConfigStore } from "@/store";
import { EASE } from "@/lib/motion";
import { ShimmerButton } from "@/components/ui/shadcn/shimmer-button";

/**
 * Primary call-to-action of the Studio — the dopamine-loop centerpiece per
 * ADR-0003 (exploration > configuration). Lives directly under the Preview
 * canvas, above the BottomBar, so it owns the most valuable real-estate of
 * the section. Space-bar binding is hosted here because the visible button
 * is the canonical surface for the action.
 *
 * Visual: Magic UI ShimmerButton — conic-gradient spark traces the border,
 * a backdrop-filled inset reveals only a 1px ring of "alive" gradient. Tuned
 * sharp (2px corners) to match the project CTA rule rather than the Magic
 * UI default pill. shimmerColor uses the GradientWall accent; background is
 * the project's surface-0 so the button reads as a panel of the dark UI,
 * not a foreign overlay.
 */
export function SurpriseMeHero() {
  const randomize = useConfigStore((s) => s.randomize);
  const [spins, setSpins] = useState(0);

  // Global Space binding. Bail out when typing inside any input so SeedBadge
  // and ColorHUD hex inputs keep working as expected.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.code === "Space") {
        e.preventDefault();
        randomize();
        setSpins((s) => s + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [randomize]);

  return (
    <div className="mt-3 flex justify-center">
      <ShimmerButton
        onClick={() => {
          randomize();
          setSpins((s) => s + 1);
        }}
        title="Randomize palette, style and seed (Space)"
        aria-label="Surprise me — generate a new wallpaper (Space)"
        background="rgba(15, 15, 18, 0.92)"
        shimmerColor="rgba(255, 255, 255, 0.92)"
        shimmerDuration="3.2s"
        shimmerSize="1px"
        borderRadius="2px"
        className="w-full max-w-[420px] px-6 py-3.5 gap-3"
      >
        <m.span
          aria-hidden
          animate={{ rotate: spins * 360 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative z-10 text-[18px] leading-none"
        >
          ✦
        </m.span>
        <span className="relative z-10 font-sans text-[13px] font-medium tracking-[0.2em] uppercase">
          Surprise me
        </span>
        <kbd
          aria-hidden
          className="
            relative z-10 hidden sm:inline-flex items-center justify-center
            min-w-[46px] h-[22px] px-2 rounded-[3px]
            bg-black/40 border border-white/20
            shadow-[inset_0_-1px_0_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.08)]
            font-sans text-[10px] tracking-[0.08em] text-white/85 normal-case
          "
        >
          Space
        </kbd>
      </ShimmerButton>
    </div>
  );
}
