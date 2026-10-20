/**
 * Shared motion primitives — single source of truth for the project's
 * signature easing curve and entrance transition.
 *
 * The curve `cubic-bezier(0.2, 0.7, 0.2, 1)` is GradientWall's cinematic
 * ease: a slow start, generous middle, soft settle. Used across Motion
 * animations (as a tuple) and plain CSS transitions (as a string).
 */

export const EASE = [0.2, 0.7, 0.2, 1] as const;
export const EASE_CSS = "cubic-bezier(.2,.7,.2,1)";

/** Entrance animation — fade-up with y-translate. */
export const FADE_UP_INITIAL = { opacity: 0, y: 16 } as const;

/**
 * Factory for the shared fade-up transition. Allows per-call delay + duration
 * overrides while locking in the easing curve. Default duration 0.7s is the
 * editorial tempo — slow enough to feel deliberate, not snappy.
 */
export function fadeUpTransition(delay = 0, duration = 0.7) {
  return { duration, ease: EASE, delay };
}

/**
 * The visitor asked the OS for less motion. The one place that reads it
 * outside Motion's own `MotionConfig reducedMotion="user"`; read at the moment
 * an animation would start. False where the browser can't tell.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** The browser reports data saver: skip work that only decorates. */
export function saveDataOn(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}
