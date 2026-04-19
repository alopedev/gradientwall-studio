import * as motion from "motion/react-client";
import type { ReactNode } from "react";
import { fadeUpTransition } from "@/lib/motion";

/**
 * Fade-up on scroll-into-view. Fires once per page load (once: true) so
 * content doesn't re-animate when scrolling back up — editorial feel, not
 * fidget-y. Default threshold is 30% visible — the element should be "in
 * the reading zone" before it animates in.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  amount = 0.3,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  amount?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={fadeUpTransition(delay)}
    >
      {children}
    </motion.div>
  );
}
