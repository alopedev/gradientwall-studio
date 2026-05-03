import { m, useScroll, useSpring } from "motion/react";

/**
 * Hairline progress bar pinned at the very top of the viewport. Width tracks
 * `scrollYProgress` (0→1) on the document root. Sits above the Nav so it
 * remains visible once the nav glass takes over.
 *
 * Spring on top of `scrollYProgress` is what gives it the "alive" feel —
 * pure scroll-linked transforms read as mechanical; a tiny lag + settle
 * reads as motion design.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });
  return (
    <m.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-[color:var(--color-accent)]"
      style={{ scaleX }}
    />
  );
}
