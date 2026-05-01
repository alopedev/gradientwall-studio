import { useEffect, useRef, type ReactNode } from "react";
import { useMotionValue, useSpring, m } from "motion/react";

interface Props {
  children: ReactNode;
  /** Capture radius in pixels (mouse must be within this distance to attract). */
  radius?: number;
  /** Maximum offset the child can be pulled (pixels). */
  strength?: number;
  className?: string;
}

/**
 * Wraps a child element so it leans toward the cursor when hovered, then
 * springs back on leave. Used on primary CTAs (Open the Studio, Buy this
 * pack, Download) where the affordance benefits from a tactile pull.
 *
 * Gated to fine pointers via `(pointer: fine)` — touch users get the
 * static element, no jitter from pointer-down/move noise. Honors
 * `prefers-reduced-motion: reduce` (no spring).
 *
 * Pure layout wrapper — `className` lets callers absorb the magnetic
 * box-model (typically `inline-block` on the parent of a normally-
 * inline anchor / button).
 */
export function MagneticButton({ children, radius = 90, strength = 8, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.5 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        x.set(0);
        y.set(0);
        return;
      }
      // Falloff: 1 at center, 0 at radius edge.
      const k = (1 - dist / radius) * strength;
      x.set((dx / radius) * k * 8);
      y.set((dy / radius) * k * 8);
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [radius, strength, x, y]);

  return (
    <span ref={ref} className={`inline-block ${className ?? ""}`}>
      <m.span style={{ x: sx, y: sy, display: "inline-block" }}>{children}</m.span>
    </span>
  );
}
