import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { remixWallpaper, shuffleWallpaper, useConfigStore } from "@/store";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useLookHistoryStore } from "@/store/useLookHistoryStore";
import { useWallpaperEngine } from "../engine";
import { AdjustPanel } from "./AdjustPanel";
import { ColorEditor } from "./ColorEditor";
import { ExportButton } from "./ExportButton";
import { PaletteList } from "./PaletteList";
import { PaletteSwatches } from "./PaletteSwatches";
import { useRequestReveal } from "./reveal";
import { SaveButton } from "./SaveButton";
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
  { id: "colors", label: "Colors" },
  { id: "adjust", label: "Adjust" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-2.5">
      <h3 className="m-0 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-white/60">
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
  const canBack = useLookHistoryStore((s) => s.past.length > 0);
  const canForward = useLookHistoryStore((s) => s.future.length > 0);
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
    say("Found one you like? Tap the heart to keep it.");
  }, [spins, say]);

  const shuffle = () => {
    requestReveal(shuffleRef.current);
    shuffleWallpaper();
    setSpins((n) => n + 1);
  };

  // aria-disabled (not `disabled`) keeps focus on the arrow when its end of the list is reached.
  const step = (e: React.MouseEvent<HTMLButtonElement>, dir: "back" | "forward") => {
    if (e.currentTarget.getAttribute("aria-disabled") === "true") return;
    requestReveal(e.currentTarget);
    useLookHistoryStore.getState()[dir]();
  };

  // Space → shuffle, R → remix (not while typing or on a focused control).
  useEffect(() => {
    if (!keysActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTypingTarget(e.target)) return;
      if (e.code === "Space") {
        e.preventDefault();
        requestReveal(shuffleRef.current);
        shuffleWallpaper();
        setSpins((n) => n + 1);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        requestReveal(shuffleRef.current);
        remixWallpaper();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keysActive, requestReveal]);

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
      className="relative z-[4] flex min-h-0 min-w-0 flex-col gap-3.5 border-l border-white/10 bg-[rgba(14,14,18,0.84)] p-[18px] [grid-area:panel] @max-[760px]:gap-3 @max-[760px]:border-l-0 @max-[760px]:border-t @max-[760px]:px-3.5 @max-[760px]:py-3.5"
    >
      <div
        role="toolbar"
        aria-label="Wallpaper controls"
        className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2"
      >
        <GlassButton
          variant="icon"
          onClick={(e) => step(e, "back")}
          aria-disabled={!canBack}
          aria-label="Previous wallpaper"
          data-tip="Previous"
          className="gws-tip aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </GlassButton>
        <GlassButton
          ref={shuffleRef}
          variant="primary"
          onClick={shuffle}
          aria-keyshortcuts="Space"
          aria-label="Shuffle: generate another wallpaper"
          className={keysActive && spins === 0 ? "gws-nudge" : ""}
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
        <GlassButton
          variant="icon"
          onClick={(e) => step(e, "forward")}
          aria-disabled={!canForward}
          aria-label="Next wallpaper"
          data-tip="Next"
          className="gws-tip aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          <ChevronRight className="size-5" aria-hidden />
        </GlassButton>
      </div>

      {/* Only the middle scrolls on a short screen: Shuffle and Download stay in view. */}
      <div className="-mx-[18px] grid min-h-0 flex-1 content-start gap-[18px] overflow-y-auto px-[18px] py-1 [scrollbar-width:thin] @max-[760px]:mx-0 @max-[760px]:gap-3 @max-[760px]:overflow-visible @max-[760px]:px-0 @max-[760px]:py-0">
        {narrow ? (
          <>
            <div
              role="tablist"
              aria-label="Controls"
              className="grid grid-cols-3 rounded-full bg-white/5 p-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]"
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
                  className="min-h-10 rounded-full font-sans text-[0.86rem] font-medium text-white/60 outline-none transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold aria-selected:bg-white/[0.14] aria-selected:text-white"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id={`${tabsId}-panel`}
              aria-labelledby={`${tabsId}-${tab}`}
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
            </div>
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
        <ExportButton onMessage={say} primary className="w-full" />
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
                className="m-0 rounded-xl bg-[rgba(28,28,34,0.97)] px-3.5 py-2 text-center font-sans text-[0.82rem] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_12px_30px_-10px_rgba(0,0,0,0.7)]"
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
    </aside>
  );
}
