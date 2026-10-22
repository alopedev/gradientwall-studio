import { AnimatePresence, m } from "motion/react";
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { remixWallpaper, shuffleWallpaper, useConfigStore } from "@/store";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useWallpaperEngine } from "../engine";
import { AdjustPanel } from "./AdjustPanel";
import { ColorEditor } from "./ColorEditor";
import { ExportButton } from "./ExportButton";
import { PaletteList } from "./PaletteList";
import { PaletteSwatches } from "./PaletteSwatches";
import { useRequestReveal } from "./reveal";
import { SaveButton } from "./SaveButton";
import { ShuffleToolbar } from "./ShuffleToolbar";
import type { ToastAction } from "./toast";

interface Props {
  /** Space and R only act while the Studio is on screen. */
  keysActive: boolean;
}

/** Same breakpoint as the frame's `@max-[760px]` layout, measured on the studio frame. */
const NARROW_PX = 760;

/** True while the studio frame is narrow (phones): the panel then groups its controls in tabs. */
function useNarrowStudio(ref: React.RefObject<HTMLElement>): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const frame = ref.current?.closest("[data-device]");
    if (!frame || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width <= NARROW_PX));
    ro.observe(frame);
    return () => ro.disconnect();
  }, [ref]);
  return narrow;
}

const HEART_HINT_KEY = "gw:hint:heart";

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

const TABS = [
  { id: "style", label: "Style" },
  { id: "colors", label: "Colours" },
  { id: "adjust", label: "Adjust" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-2.5">
      <h3 className="m-0 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ink-dim">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * The Studio's control panel, beside the wallpaper: ‹ Shuffle › on top, then
 * style, palettes, the four colors, the sliders, and Save + Download at the
 * bottom. Everything is in view at once. On a phone-wide frame it sits under
 * the wallpaper and groups the controls in Style / Colors / Adjust tabs.
 */
export function StudioInspector({ keysActive }: Props) {
  const engine = useWallpaperEngine();
  const style = useConfigStore((s) => s.style);
  const setStyle = useConfigStore((s) => s.setStyle);
  const requestReveal = useRequestReveal();
  const tabsId = useId();
  const shuffleRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const narrow = useNarrowStudio(rootRef);
  const [tab, setTab] = useState<Tab>("style");
  const [spins, setSpins] = useState(0);
  const [toast, setToast] = useState<{ message: string; action?: ToastAction } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const say = useCallback((message: string, action?: ToastAction) => {
    clearTimeout(toastTimer.current);
    setToast({ message, action });
    // A toast with a link stays long enough to read and reach it.
    toastTimer.current = setTimeout(() => setToast(null), action ? 7000 : 3200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // After a few shuffles, point at the heart once (never to someone who already saves).
  const heartHinted = useRef(false);
  useEffect(() => {
    if (spins < 3 || heartHinted.current) return;
    heartHinted.current = true;
    try {
      if (localStorage.getItem(HEART_HINT_KEY) || useFavoritesStore.getState().items.length > 0) {
        return;
      }
      localStorage.setItem(HEART_HINT_KEY, "1");
    } catch {
      // Storage blocked: show the hint this once per visit.
    }
    say("Found one you like? Keep it with the heart.");
  }, [spins, say]);

  // The button and the Space key: reveal from the button, new wallpaper, half a turn.
  const shuffle = useCallback(() => {
    requestReveal(shuffleRef.current);
    shuffleWallpaper();
    setSpins((n) => n + 1);
  }, [requestReveal]);

  // Space → shuffle, R → remix (not while typing or on a focused control).
  useEffect(() => {
    if (!keysActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTypingTarget(e.target)) return;
      if (e.code === "Space") {
        e.preventDefault();
        shuffle();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        requestReveal(shuffleRef.current);
        remixWallpaper();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keysActive, requestReveal, shuffle]);

  const styleControl = (
    <SegmentedControl
      ariaLabel="Style"
      value={style}
      onChange={setStyle}
      options={engine.styles.map((s) => ({ value: s.id, label: s.label }))}
      className="flex w-full"
    />
  );

  return (
    <aside
      ref={rootRef}
      aria-label="Studio controls"
      className="relative z-[4] flex min-h-0 min-w-0 flex-col gap-3.5 border-l-2 border-ink bg-bg p-[18px] [grid-area:panel] @max-[760px]:gap-3 @max-[760px]:border-l-0 @max-[760px]:border-t-2 @max-[760px]:px-3.5 @max-[760px]:py-3.5"
    >
      <ShuffleToolbar
        ref={shuffleRef}
        spins={spins}
        onShuffle={shuffle}
        onStep={requestReveal}
        shortcut="Space"
        tips
        shuffleClassName={keysActive && spins === 0 ? "gws-nudge" : ""}
        className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center justify-items-center gap-2"
      />

      {/* Only the middle scrolls on a short screen: Shuffle and Download stay in view. */}
      <div className="-mx-[18px] grid min-h-0 flex-1 content-start gap-[18px] overflow-y-auto px-[18px] py-1 [scrollbar-width:thin] @max-[760px]:mx-0 @max-[760px]:gap-3 @max-[760px]:overflow-visible @max-[760px]:px-0 @max-[760px]:py-0">
        {narrow ? (
          <>
            <div
              role="tablist"
              aria-label="Controls"
              className="grid grid-cols-3 rounded-sharp p-[3px] shadow-[inset_0_0_0_2px_var(--color-ink)]"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`${tabsId}-panel`}
                  onClick={() => setTab(t.id)}
                  className="relative min-h-10 rounded-[2px] font-sans text-[0.86rem] font-medium text-ink-dim outline-none transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-selected:text-bg"
                >
                  {/* One ink fill that slides between the tabs, like the device switch. */}
                  {tab === t.id && (
                    <m.span
                      layoutId={`${tabsId}-tab`}
                      aria-hidden
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-[2px] bg-ink"
                    />
                  )}
                  <span className="relative">{t.label}</span>
                </button>
              ))}
            </div>
            <m.div
              key={tab}
              role="tabpanel"
              id={`${tabsId}-panel`}
              aria-labelledby={`${tabsId}-${tab}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
              className="grid gap-3"
            >
              {tab === "style" && styleControl}
              {tab === "colors" && (
                <>
                  <div className="flex justify-center">
                    <PaletteSwatches />
                  </div>
                  <ColorEditor onMessage={say} />
                </>
              )}
              {tab === "adjust" && <AdjustPanel />}
            </m.div>
          </>
        ) : (
          <>
            <Group title="Style">{styleControl}</Group>
            <Group title="Palette">
              <PaletteList />
            </Group>
            <ColorEditor onMessage={say} />
            <AdjustPanel />
          </>
        )}
      </div>

      <div className="relative grid grid-cols-[44px_minmax(0,1fr)] items-center gap-2">
        <SaveButton onMessage={say} />
        <ExportButton onMessage={say} className="w-full" />
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 bottom-[calc(100%+10px)] z-10"
        >
          <AnimatePresence>
            {toast && (
              <m.p
                key={toast.message}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 360, damping: 26 }}
                className="m-0 rounded-sharp bg-ink px-3.5 py-2 text-center font-sans text-[0.82rem] text-bg"
              >
                {toast.message}
                {toast.action && (
                  <>
                    {" "}
                    <a
                      href={toast.action.href}
                      className="pointer-events-auto font-medium text-bg underline underline-offset-2 focus-ring"
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
    </aside>
  );
}
