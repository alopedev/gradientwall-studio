/**
 * The v2 shader with a slow drift over time, for backgrounds that move.
 *
 * Derived from `FRAG` by two edits, so the signed-off source in `shader.ts`
 * stays untouched and the two can't drift apart: a `uTime` uniform, and every
 * noise offset (`seedOff`) circling a little as time passes. Each drift term
 * is written f(t + φ) − f(φ), so at t = 0 it is exactly zero and the first
 * frame is the approved still.
 */

import { FRAG } from "./shader";

const UNIFORM_ANCHOR = /(uniform float uDither;[^\n]*\n)/;
const SEED_OFF_ANCHOR = /vec2 seedOff\(uint salt\)\{[^\n]*\}/;

const SEED_OFF_DRIFTING =
  "vec2 seedOff(uint salt){ float k = float(salt); vec2 ph = vec2(k*1.7, k*2.3); " +
  "return (hash3(uvec3(uSeed, salt, 7u)).xy - 0.5) * 200.0 + " +
  "vec2(cos(uTime*0.17 + ph.x) - cos(ph.x), sin(uTime*0.14 + ph.y) - sin(ph.y)) * 0.55; }";

function animate(frag: string): string {
  if (!UNIFORM_ANCHOR.test(frag) || !SEED_OFF_ANCHOR.test(frag)) {
    throw new Error("shader.ts changed: update shader-animated.ts to match");
  }
  return frag
    .replace(UNIFORM_ANCHOR, "$1uniform float uTime;       // seconds; drifts the noise field\n")
    .replace(SEED_OFF_ANCHOR, SEED_OFF_DRIFTING);
}

export const FRAG_ANIMATED = animate(FRAG);
