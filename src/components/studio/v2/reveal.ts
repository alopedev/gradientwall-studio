import { createContext, type MutableRefObject, useContext } from "react";

/** Where on screen a change was triggered from, in client coordinates. */
export interface RevealRequest {
  x: number;
  y: number;
  at: number;
}

/** Requests older than this are ignored, so a slider tick never inherits a stale origin. */
export const REVEAL_TTL_MS = 800;

export const RevealContext = createContext<MutableRefObject<RevealRequest | null> | null>(null);

/**
 * Returns a function to call right before changing the wallpaper from a
 * button: the stage then reveals the new frame as a circle that grows out of
 * that element. Without a call (slider drags, for example) the change just
 * repaints.
 */
export function useRequestReveal(): (from: Element | null) => void {
  const ref = useContext(RevealContext);
  return (from) => {
    if (!ref || !from) return;
    const r = from.getBoundingClientRect();
    ref.current = { x: r.left + r.width / 2, y: r.top + r.height / 2, at: performance.now() };
  };
}

/** The circular reveal (B1, 2026-10-20): short, and shorter when shuffles come in a row. */
export const REVEAL_MS = 420;
export const REVEAL_QUICK_MS = 240;
/** A reveal that starts this soon after the previous one is part of a run. */
const RUN_GAP_MS = 1200;

/** How long the next reveal lasts, given the time since the previous one started (null: none yet). */
export function revealDurationMs(sinceLastMs: number | null): number {
  return sinceLastMs !== null && sinceLastMs < RUN_GAP_MS ? REVEAL_QUICK_MS : REVEAL_MS;
}
