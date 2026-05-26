import { Children, isValidElement, type ReactNode } from "react";
import { Reveal, type RevealVariant } from "./Reveal";

export function computeStaggerDelays(count: number, step = 0.08, baseDelay = 0): number[] {
  return Array.from({ length: count }, (_, i) => Math.round((baseDelay + i * step) * 1000) / 1000);
}

/**
 * Wraps each top-level child in a `<Reveal>` with an incrementing delay —
 * gives a section the editorial cascade feel without hand-wiring delays.
 * Delegates easing/duration to `<Reveal>` so the project keeps one source of
 * truth for the signature curve.
 *
 * `data-stagger-delay` on each wrapper is a testing affordance, not styling.
 */
export function Stagger({
  children,
  step = 0.08,
  baseDelay = 0,
  y,
  amount,
  variant,
  className,
}: {
  children: ReactNode;
  step?: number;
  baseDelay?: number;
  y?: number;
  amount?: number;
  variant?: RevealVariant;
  className?: string;
}) {
  const items = Children.toArray(children).filter(isValidElement);
  const delays = computeStaggerDelays(items.length, step, baseDelay);
  return (
    <>
      {items.map((child, i) => (
        <Reveal
          key={child.key ?? i}
          delay={delays[i]}
          y={y}
          amount={amount}
          variant={variant}
          className={className}
        >
          <span data-stagger-delay={delays[i]} style={{ display: "contents" }}>
            {child}
          </span>
        </Reveal>
      ))}
    </>
  );
}
