import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { EASE } from "@/lib/motion";

const STORAGE_KEY = "gw_studio_hints_dismissed";

/**
 * One-shot exploration hint shown on first Studio visit. Surfaces the two
 * gestures most likely to short-circuit the "open every panel" learning
 * curve: the Space-bar Surprise-me shortcut and the drop-an-image-anywhere
 * affordance over the preview. Auto-dismisses on any interaction; never
 * shown again once dismissed (localStorage flag).
 *
 * Lives under the Studio Preview so the hint sits visually next to the
 * canvas it talks about, not floating in the chrome.
 */
export function StudioHints() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // Privacy mode etc — better to not surface than to nag every visit.
      return;
    }
    setShow(true);
    const dismiss = () => setShow(false);
    // Any meaningful interaction with the Studio counts as "got it".
    window.addEventListener("keydown", dismiss, { once: true });
    window.addEventListener("pointerdown", dismiss, { once: true });
    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismiss);
    };
  }, []);

  useEffect(() => {
    if (show) return;
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="liquid-subtle rounded-[2px] border border-white/10 mt-3 px-3.5 py-2.5 flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-3 flex-wrap font-sans text-[11px] tracking-[0.05em] text-white/65">
            <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-white/45">
              Tip
            </span>
            <span>
              Press{" "}
              <kbd className="inline-flex items-center justify-center min-w-[22px] h-[16px] px-1 rounded-[3px] bg-white/10 border border-white/15 text-[9px] tracking-[0.05em] text-white/85 normal-case">
                Space
              </kbd>{" "}
              to surprise yourself · drop an image anywhere on the preview to extract its palette.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            aria-label="Dismiss hint"
            className="font-sans text-[10px] tracking-[0.18em] uppercase text-white/45 hover:text-white/85 transition-colors duration-150"
          >
            Got it
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
