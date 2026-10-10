import { AnimatePresence, m } from "motion/react";
import { useConfigStore } from "@/store";

/**
 * Soft glow behind the device, tinted with the current palette. It crossfades
 * whenever the palette changes, so the whole stage seems lit by the wallpaper.
 */
export function StageHalo() {
  const colors = useConfigStore((s) => s.colors);
  const key = colors.join(",");
  const [c0, c1, c2, c3] = colors;
  const background = [
    `radial-gradient(55% 60% at 22% 30%, ${c1}, transparent 70%)`,
    `radial-gradient(50% 55% at 80% 35%, ${c2}, transparent 70%)`,
    `radial-gradient(65% 55% at 50% 90%, ${c3}, transparent 72%)`,
    c0,
  ].join(", ");
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <AnimatePresence>
        <m.i
          key={key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ background }}
          className="absolute left-1/2 top-[44%] block h-[105%] w-[150%] max-w-[1180px] -translate-x-1/2 -translate-y-1/2 blur-[28px] saturate-[1.1] [max-height:900px]"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,transparent_40%,rgba(5,5,7,0.55)_100%)]" />
    </div>
  );
}
