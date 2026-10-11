/**
 * Default render values, in one place. Pure: imports nothing, so `palettes.ts`,
 * the engines, the store and the generators can all depend on it without cycles.
 *
 * Two different questions share the word "default":
 *
 * 1. **Fallback** — what a renderer assumes when a saved config lacks the field.
 *    These reproduce how old favorites were drawn, so they must not change.
 * 2. **Starting look** — what a fresh Studio session begins with and what the
 *    Adjust panel's Reset returns to.
 */

// ── Fallbacks for absent fields (legacy favorites keep rendering as saved) ──
/** Light angle assumed when absent. */
export const DEFAULT_LIGHT_ANGLE = 135;
/** Density assumed when absent: the midpoint reproduces the pre-density layer counts. */
export const DEFAULT_DENSITY = 0.5;
/** Contrast / vibrance assumed when absent: identity (no grading). */
export const DEFAULT_CONTRAST = 1;
export const DEFAULT_VIBRANCE = 1;

// ── Starting look of the Studio ──
export const STUDIO_BLUR = 48;
/** Subtle pop; only the Canvas2D engine exposes vibrance. */
export const STUDIO_VIBRANCE = 1.05;

/**
 * v2 light direction, as a compass angle: 315 (top-left) is the prototype's
 * math 135°, the direction its signed-off renders were made with.
 */
export const V2_DEFAULT_LIGHT_ANGLE = 315;
/** v2 grain slider value (0..100) for the approved look of liquid and aurora. */
export const V2_DEFAULT_GRAIN = 45;

/** Canvas2D (v1) engine's own Reset target for grain. */
export const V1_DEFAULT_GRAIN = 32;
