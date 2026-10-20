/**
 * The download tells the device screen what it is doing, so the screen can
 * "print" the wallpaper while the file renders (C1, 2026-10-20). The button
 * and the stage are siblings, hence a tiny bus instead of props.
 */
export type PrintEvent = "start" | "done" | "fail";

const listeners = new Set<(e: PrintEvent) => void>();

export function emitPrint(e: PrintEvent): void {
  for (const fn of listeners) fn(e);
}

/** Subscribe; returns the unsubscribe. */
export function onPrint(fn: (e: PrintEvent) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
