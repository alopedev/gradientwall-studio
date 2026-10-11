import { Shuffle, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useConfigStore } from "@/store";
import { useWallpaperEngine } from "../engine";
import { AdjustPanel } from "./AdjustPanel";
import { ExportButton } from "./ExportButton";
import { PaletteSwatches } from "./PaletteSwatches";
import { useRequestReveal } from "./reveal";
import { SaveButton } from "./SaveButton";
import type { ToastAction } from "./toast";

interface Props {
  adjustOpen: boolean;
  onToggleAdjust: () => void;
  /** Space and R only act while the Studio is on screen. */
  keysActive: boolean;
}

const isTypingTarget = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null;
  if (!el) return false;
  // Space on a button/link/slider belongs to that control, not to Shuffle.
  return (
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(el.tagName) ||
    el.isContentEditable ||
    el.getAttribute("role") === "slider"
  );
};

/** Floating glass bar with every control, plus the toast and the Adjust panel. */
export function StudioDock({ adjustOpen, onToggleAdjust, keysActive }: Props) {
  const engine = useWallpaperEngine();
  const style = useConfigStore((s) => s.style);
  const setStyle = useConfigStore((s) => s.setStyle);
  const applySurprise = useConfigStore((s) => s.applySurprise);
  const applyRemix = useConfigStore((s) => s.applyRemix);
  const requestReveal = useRequestReveal();
  const panelId = useId();
  const shuffleRef = useRef<HTMLButtonElement>(null);
  const [spins, setSpins] = useState(0);
  const [toast, setToast] = useState<{ message: string; action?: ToastAction } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const say = (message: string, action?: ToastAction) => {
    clearTimeout(toastTimer.current);
    setToast({ message, action });
    // A toast with a link stays long enough to read and reach it.
    toastTimer.current = setTimeout(() => setToast(null), action ? 7000 : 3200);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const shuffle = () => {
    requestReveal(shuffleRef.current);
    applySurprise();
    setSpins((n) => n + 1);
  };

  // Space → shuffle, R → remix (not while typing or on a focused control).
  useEffect(() => {
    if (!keysActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTypingTarget(e.target)) return;
      if (e.code === "Space") {
        e.preventDefault();
        requestReveal(shuffleRef.current);
        applySurprise();
        setSpins((n) => n + 1);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        requestReveal(shuffleRef.current);
        applyRemix();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keysActive, applySurprise, applyRemix, requestReveal]);

  return (
    <div className="relative w-fit max-w-[calc(100%-32px)] justify-self-center rounded-[22px] bg-gradient-to-b from-white/10 to-white/[0.035] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_0_0_1px_rgba(255,255,255,0.08),0_24px_60px_-18px_rgba(0,0,0,0.75),0_2px_10px_rgba(0,0,0,0.25)] backdrop-blur-[26px] backdrop-saturate-[1.7] backdrop-brightness-105 @max-[760px]:mx-2.5 @max-[760px]:w-auto @max-[760px]:max-w-none @max-[760px]:justify-self-stretch @max-[760px]:rounded-[20px]">
      <div
        role="toolbar"
        aria-label="Wallpaper controls"
        className="flex flex-wrap items-center justify-center gap-2 @max-[760px]:grid @max-[760px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] @max-[760px]:[grid-template-areas:'shuffle_shuffle_save''style_style_style''pal_pal_pal''adj_exp_exp']"
      >
        <GlassButton
          ref={shuffleRef}
          variant="primary"
          onClick={shuffle}
          aria-keyshortcuts="Space"
          aria-label="Shuffle: generate another wallpaper"
          className="pr-2.5 @max-[760px]:[grid-area:shuffle]"
        >
          <m.span
            aria-hidden
            animate={{ rotate: spins * 180 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            className="inline-flex"
          >
            <Shuffle className="size-[18px]" strokeWidth={2.1} />
          </m.span>
          <span>Shuffle</span>
          <kbd
            aria-hidden
            className="ml-1 rounded-md bg-[rgba(23,19,10,0.1)] px-[7px] py-[5px] font-sans text-[0.68rem] font-semibold leading-none tracking-[0.04em] shadow-[inset_0_0_0_1px_rgba(23,19,10,0.2),inset_0_-1px_0_rgba(23,19,10,0.18)] [@media(hover:none)]:hidden"
          >
            Space
          </kbd>
        </GlassButton>

        <Sep />
        <SegmentedControl
          ariaLabel="Style"
          value={style}
          onChange={setStyle}
          options={engine.styles.map((s) => ({ value: s.id, label: s.label }))}
          className="@max-[760px]:[grid-area:style]"
        />
        <Sep />
        <div className="@max-[760px]:flex @max-[760px]:justify-center @max-[760px]:[grid-area:pal]">
          <PaletteSwatches />
        </div>
        <Sep />
        <div className="@max-[760px]:[grid-area:save]">
          <SaveButton onMessage={say} />
        </div>
        <GlassButton
          onClick={onToggleAdjust}
          aria-expanded={adjustOpen}
          aria-controls={adjustOpen ? panelId : undefined}
          className="min-w-max @max-[760px]:min-w-0 @max-[760px]:px-2.5 @max-[760px]:[grid-area:adj]"
        >
          <SlidersHorizontal className="size-[18px]" aria-hidden />
          Adjust
        </GlassButton>
        <div className="contents @max-[760px]:[&>*]:[grid-area:exp]">
          <ExportButton onMessage={say} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {adjustOpen && (
          <m.div
            key="adjust"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="overflow-hidden"
          >
            <AdjustPanel id={panelId} />
          </m.div>
        )}
      </AnimatePresence>

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none absolute left-1/2 top-[calc(100%+12px)] w-max max-w-[min(560px,calc(100vw-48px))] -translate-x-1/2"
      >
        <AnimatePresence>
          {toast && (
            <m.p
              key={toast.message}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="m-0 rounded-xl bg-[rgba(20,20,24,0.94)] px-3.5 py-2 text-center font-sans text-[0.82rem] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_12px_30px_-10px_rgba(0,0,0,0.7)] backdrop-blur-[18px] backdrop-saturate-[1.6]"
            >
              {toast.message}
              {toast.action && (
                <>
                  {" "}
                  <a
                    href={toast.action.href}
                    className="pointer-events-auto font-medium text-gold underline underline-offset-2 hover:text-white focus-ring"
                  >
                    {toast.action.label}
                  </a>
                </>
              )}
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Sep() {
  return (
    <span aria-hidden className="mx-0.5 my-2 w-px self-stretch bg-white/10 @max-[760px]:hidden" />
  );
}
