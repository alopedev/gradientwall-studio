import { m } from "motion/react";
import type { ReactNode } from "react";
import { fadeUpTransition } from "@/lib/motion";

export type RevealVariant = "fade" | "blur" | "mask";

const initialFor = (variant: RevealVariant, y: number) => {
  switch (variant) {
    case "blur":
      return { opacity: 0, y, filter: "blur(12px)" };
    case "mask":
      return { opacity: 0, y, clipPath: "inset(0 100% 0 0)" };
    case "fade":
    default:
      return { opacity: 0, y };
  }
};

const animateFor = (variant: RevealVariant) => {
  switch (variant) {
    case "blur":
      return { opacity: 1, y: 0, filter: "blur(0px)" };
    case "mask":
      return { opacity: 1, y: 0, clipPath: "inset(0 0% 0 0)" };
    case "fade":
    default:
      return { opacity: 1, y: 0 };
  }
};

/**
 * Reveal-on-scroll wrapper. Three flavors:
 *
 *  - `fade` (default): the original opacity + translateY entrance.
 *  - `blur`: starts at `filter: blur(12px)`; resolves to crisp. Reads as
 *    "the section comes into focus" — good for editorial section heads.
 *  - `mask`: starts with a horizontal clip-path occluding the content;
 *    reveals left-to-right. Theatrical — reserve for hero moments.
 *
 * Fires once (once: true), so scrolling back up doesn't re-animate.
 * Default amount-in-view threshold is 30%.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  amount = 0.3,
  variant = "fade",
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  amount?: number;
  variant?: RevealVariant;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      initial={initialFor(variant, y)}
      whileInView={animateFor(variant)}
      viewport={{ once: true, amount }}
      transition={fadeUpTransition(delay)}
    >
      {children}
    </m.div>
  );
}
