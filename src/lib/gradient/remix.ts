import type { GradientConfig } from "../palettes";
import { pickCuratedSeedExcluding } from "./curated-seeds";
import {
  CURATED_CONTRAST,
  CURATED_GRAIN,
  CURATED_VIBRANCE,
  SURPRISE_DENSITY_MAX,
  SURPRISE_DENSITY_MIN,
  SURPRISE_LIGHT_MAX,
  SURPRISE_LIGHT_MIN,
} from "./surprise";

/**
 * `generateRemix` — variación cercana de un wallpaper existente.
 *
 * El usuario aprieta "Remix" cuando le gusta la dirección general (la paleta,
 * el style) pero quiere ver otra cara de la misma idea. Mantenemos lo que
 * tiene sentido conservar y variamos solo lo que cambia la composición:
 *
 * - **Conservados**: `colors`, `style`, defaults curados de grain / contrast /
 *   vibrance. El feel mood no debe romperse.
 * - **Variado**: `seed` (cualquier curado distinto al actual),
 *   `lightAngle` ±30° (gira la luz pero no la voltea),
 *   `density` ±0.1 (más o menos capas, sin saltos bruscos),
 *   `blur` ±10 (sutil softness shift).
 *
 * Todos los rangos se clampean a los límites operativos del motor
 * (mismos que usa `generateSurprise`). Acepta `rng` inyectable para tests.
 */

/** Magnitud del giro de light angle en remix (±30°). */
export const REMIX_LIGHT_DELTA = 30;

/** Magnitud del giro de density en remix (±0.1). */
export const REMIX_DENSITY_DELTA = 0.1;

/** Magnitud del giro de blur en remix (±10). */
export const REMIX_BLUR_DELTA = 10;

const clamp = (n: number, min: number, max: number): number =>
  n < min ? min : n > max ? max : n;

const wrapAngle = (deg: number): number => ((deg % 360) + 360) % 360;

/**
 * Aplica un delta aleatorio centrado en cero (`[-delta, +delta]`).
 */
function jitter(value: number, delta: number, rng: () => number): number {
  return value + (rng() * 2 - 1) * delta;
}

/**
 * Genera una variación cercana de `current`. El resultado mantiene paleta y
 * style y siempre tiene un seed distinto al actual (vía
 * `pickCuratedSeedExcluding`).
 *
 * @param current Config actual del Studio.
 * @param rng     PRNG opcional. Por defecto `Math.random`.
 */
export function generateRemix(current: GradientConfig, rng: () => number = Math.random): GradientConfig {
  const seed = pickCuratedSeedExcluding(current.seed, rng);

  const baseLight = current.lightAngle ?? 135;
  const nextLight = wrapAngle(jitter(baseLight, REMIX_LIGHT_DELTA, rng));
  // Re-clampea al rango operativo (la suma puede dejar fuera si baseLight ya
  // estaba en el borde). Asegura que nunca devolvemos algo que generateSurprise
  // no produciría.
  const lightAngle = Math.round(clamp(nextLight, SURPRISE_LIGHT_MIN, SURPRISE_LIGHT_MAX));

  const baseDensity = current.density ?? 0.5;
  const density = clamp(
    jitter(baseDensity, REMIX_DENSITY_DELTA, rng),
    SURPRISE_DENSITY_MIN,
    SURPRISE_DENSITY_MAX,
  );

  const baseBlur = current.blur;
  const blur = Math.round(clamp(jitter(baseBlur, REMIX_BLUR_DELTA, rng), 0, 200));

  return {
    colors: current.colors,
    style: current.style,
    blur,
    grain: CURATED_GRAIN,
    seed,
    lightAngle,
    density,
    contrast: CURATED_CONTRAST,
    vibrance: CURATED_VIBRANCE,
  };
}
