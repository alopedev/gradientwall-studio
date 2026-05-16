import { useEffect, useState } from "react";
import { m } from "motion/react";
import { useConfigStore } from "@/store";
import { EASE } from "@/lib/motion";

/**
 * Primary call-to-action of the Studio — the dopamine-loop centerpiece per
 * ADR-0003 (exploration > configuration). Lives directly under the Preview
 * canvas, above the BottomBar, so it owns the most valuable real-estate of
 * the section. Space-bar binding is hosted here because the visible button
 * is the canonical surface for the action.
 *
 * Intentionally bigger and louder than the Download button: the Download
 * is the *outcome*, Surprise me is the *gesture* the user repeats. The
 * dopamine research (LSE 2024, Headspace) says anticipation > reveal —
 * the gesture must feel physically good.
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
      <m.button
        type="button"
        onClick={() => {
          randomize();
          setSpins((s) => s + 1);
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18, ease: EASE }}
        title="Randomize palette, style and seed (Space)"
        className="
          group relative w-full max-w-[420px]
          inline-flex items-center justify-center gap-3
          rounded-[2px] px-6 py-3.5
          bg-gradient-to-b from-white/[0.10] to-white/[0.04]
          border border-white/15
          shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_-12px_rgba(0,0,0,0.6)]
          hover:border-white/30 hover:from-white/[0.14] hover:to-white/[0.06]
          hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_12px_36px_-12px_rgba(0,0,0,0.7),0_0_24px_-8px_rgba(255,255,255,0.18)]
          transition-[background,border-color,box-shadow] duration-200 ease-out
          focus-ring
        "
        aria-label="Surprise me — generate a new wallpaper (Space)"
      >
        {/* Backlight halo — subtle, intensifies on hover */}
        <span
          aria-hidden
          className="absolute inset-x-8 -inset-y-px rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out pointer-events-none"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.10), transparent 70%)",
          }}
        />

        <m.span
          aria-hidden
          animate={{ rotate: spins * 360 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative text-[18px] leading-none text-white"
        >
          ✦
        </m.span>

        <span className="relative font-sans text-[13px] font-medium tracking-[0.2em] uppercase text-white">
          Surprise me
        </span>

        <kbd
          aria-hidden
          className="
            relative hidden sm:inline-flex items-center justify-center
            min-w-[46px] h-[22px] px-2 rounded-[3px]
            bg-black/40 border border-white/20
            shadow-[inset_0_-1px_0_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.08)]
            font-sans text-[10px] tracking-[0.08em] text-white/85 normal-case
          "
        >
          Space
        </kbd>
      </m.button>
    </div>
  );
}
