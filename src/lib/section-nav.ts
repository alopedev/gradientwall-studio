/**
 * Pure helpers for links that lead to a section of the page (`/#studio`,
 * `/#packs`): which way the page moves, and whether an element is on screen
 * (only an element in view may fly to the target; one off screen would cross
 * the whole page).
 */

/** How close to the top a target must be to count as already there, in px. */
const ARRIVED_PX = 8;

/**
 * The page animation for a jump to a target `top` px from the top of the
 * viewport: content moves up when the target is below, down when it is above.
 */
export function scrollKind(top: number): "scroll-down" | "scroll-up" | undefined {
  if (Math.abs(top) <= ARRIVED_PX) return undefined;
  return top > 0 ? "scroll-down" : "scroll-up";
}

/**
 * True when a section `top` px from the top of a viewport `vh` tall is
 * already where the visitor is looking: a link to it then only settles it
 * into place, without replaying the page transition.
 */
export function alreadyThere(top: number, vh: number): boolean {
  return Math.abs(top) < vh * 0.5;
}

interface Box {
  top: number;
  bottom: number;
  width: number;
}

/** True when some of `box` is inside a viewport `vh` px tall. */
export function onScreen(box: Box, vh: number): boolean {
  return box.width > 0 && box.bottom > box.top && box.bottom > 0 && box.top < vh;
}
