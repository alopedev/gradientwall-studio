import { m } from "motion/react";
import { EASE } from "@/lib/motion";

const CONTAINER = {
  hidden: {},
  visible: (stagger = 0.07) => ({ transition: { staggerChildren: stagger } }),
};
const WORD = {
  hidden: { opacity: 0, y: "55%", filter: "blur(8px)" },
  visible: { opacity: 1, y: "0%", filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

/**
 * Splits a string by whitespace and animates each word into place — y-rise
 * + blur clear, cascade by stagger. Drop-in replacement for plain text in
 * a heading. The wrapper inherits font from its parent so callers keep
 * total typographic control via className.
 *
 * Reduced-motion users get the static end state via `MotionConfig` upstream.
 */
export function SplitWords({
  text,
  className,
  stagger = 0.07,
  amount = 0.5,
  delayChildren = 0,
}: {
  text: string;
  className?: string;
  stagger?: number;
  amount?: number;
  delayChildren?: number;
}) {
  const words = text.split(/\s+/);
  return (
    <m.span
      className={className}
      style={{ display: "inline-block" }}
      variants={CONTAINER}
      custom={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      transition={{ delayChildren }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.08em" }}
        >
          <m.span variants={WORD} style={{ display: "inline-block" }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </m.span>
        </span>
      ))}
    </m.span>
  );
}
