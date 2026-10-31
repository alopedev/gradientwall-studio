/**
 * The v2 shader with a turn the visitor sets (the Studio's Rotate slider).
 *
 * Derived from a source by two edits, like `shader-animated.ts`, so the
 * signed-off `FRAG` in `shader.ts` stays untouched: a `uRotate` uniform
 * (radians), added to the seed's own field angle. At 0 the sum is exact, so
 * an unrotated wallpaper is the approved pixels. Liquid and mesh turn; aurora
 * hangs from the top of the screen and has no field angle, so it ignores it.
 */

import { FRAG } from "./shader";
import { FRAG_ANIMATED } from "./shader-animated";

const UNIFORM_ANCHOR = /(uniform float uDither;[^\n]*\n)/;
const ANGLE_ANCHOR = /float ang = sh\.x \* 6\.2831853;/;

export function rotatable(frag: string): string {
  if (!UNIFORM_ANCHOR.test(frag) || !ANGLE_ANCHOR.test(frag)) {
    throw new Error("shader.ts changed: update shader-rotate.ts to match");
  }
  return frag
    .replace(UNIFORM_ANCHOR, "$1uniform float uRotate;     // radians; turns the colour field\n")
    .replace(ANGLE_ANCHOR, "float ang = sh.x * 6.2831853 + uRotate;");
}

/** What the renderer compiles: the still and the drifting shader, both turnable. */
export const FRAG_STILL_ROTATABLE = rotatable(FRAG);
export const FRAG_ANIMATED_ROTATABLE = rotatable(FRAG_ANIMATED);
