import { AnimatePresence, m } from "motion/react";
import { useConfigStore } from "@/store";

/**
 * The page's own light: big blurred pools of the current palette behind the
 * first screen, fading into the page background underneath. It crossfades on
 * every Shuffle, so the whole hero takes the colour of the wallpaper. Pure
 * CSS, so it is on screen before WebGL has painted a single frame.
 */
export function HeroAmbient() {
  const colors = useConfigStore((s) => s.colors);
  const key = colors.join(",");
  const [c0, c1, c2, c3] = colors;
  const background = [
    `radial-gradient(45% 55% at 12% 20%, ${c1}, transparent 70%)`,
    `radial-gradient(40% 50% at 88% 30%, ${c2}, transparent 70%)`,
    `radial-gradient(60% 50% at 55% 100%, ${c3}, transparent 72%)`,
    c0,
  ].join(", ");
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]"
    >
      <AnimatePresence>
        <m.i
          key={key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ background }}
          className="absolute inset-0 block blur-[60px] saturate-[1.15]"
        />
      </AnimatePresence>
    </div>
  );
}
