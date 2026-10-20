import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { onPrint } from "./print";

/** How far the sheet uncovers while the file is still rendering, and how long that takes. */
const HOLD_AT = 88;
const PRINT_MS = 1000;
const FINISH_MS = 240;
const EASE = "cubic-bezier(.45,0,.55,1)";

function reducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * While a download renders, the device screen turns to paper and the
 * wallpaper prints back onto it from the top, an ink line marking the print
 * head. It waits near the bottom until the file is ready, then finishes.
 * With reduced motion it never shows: the button's progress says enough.
 */
export function PrintSweep() {
  const [on, setOn] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const running = useRef<Animation[]>([]);

  useEffect(() => {
    const stop = () => {
      for (const a of running.current) a.cancel();
      running.current = [];
      setOn(false);
    };
    const finish = () => {
      const s = sheet.current;
      const h = head.current;
      if (!s?.animate || !h) return stop();
      const opts = { duration: FINISH_MS, easing: EASE, fill: "forwards" as const };
      const a = s.animate(
        [{ clipPath: `inset(${HOLD_AT}% 0 0 0)` }, { clipPath: "inset(100% 0 0 0)" }],
        opts,
      );
      h.animate([{ top: `${HOLD_AT}%` }, { top: "100%", opacity: 0 }], opts);
      a.finished.then(stop, () => undefined);
    };
    return onPrint((e) => {
      if (e === "start") {
        if (!reducedMotion()) setOn(true);
      } else if (e === "fail") {
        stop();
      } else {
        const printing = running.current[0];
        if (!printing) return stop();
        printing.finished.then(finish, () => undefined);
      }
    });
  }, []);

  useLayoutEffect(() => {
    const s = sheet.current;
    const h = head.current;
    if (!on || !s?.animate || !h) return;
    const opts = { duration: PRINT_MS, easing: EASE, fill: "forwards" as const };
    running.current = [
      s.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: `inset(${HOLD_AT}% 0 0 0)` }], opts),
      h.animate([{ top: "0%" }, { top: `${HOLD_AT}%` }], opts),
    ];
  }, [on]);

  if (!on) return null;
  return (
    <div data-part="print-sweep" aria-hidden className="pointer-events-none absolute inset-0 z-[7]">
      <div ref={sheet} className="absolute inset-0 bg-bg-2" />
      <div ref={head} className="absolute inset-x-0 top-0 h-0.5 bg-ink" />
    </div>
  );
}
