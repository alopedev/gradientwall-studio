import { type Colors4, DEFAULT_CONTRAST, type GradientConfig, type Style } from "../palettes";
import { pickCuratedSeed, pickCuratedSeedExcluding } from "./curated-seeds";
import { randomHarmonicColors } from "./palette-constraints";
import { mulberry32 } from "./spec";

/**
 * `generateSurprise` — núcleo del modelo "surprise-first" de Studio v2.
 *
 * Devuelve un `GradientConfig` completo (paleta armónica + style + seed +
 * light + density) listo para que `useConfigStore.applySurprise` lo aplique
 * atómicamente. Cada llamada produce un wallpaper distinto al anterior
 * (excluye el seed previo).
 *
 * **Style weighted**:
 * - liquid 35% — el más versátil y "calmo".
 * - mesh 30%   — el clásico, alta variedad.
 * - aurora 25% — dramático, light angle muy expresivo.
 * - nebula 10% — caro (WebGL); usado con moderación para no machacar batería.
 *
 * **lightAngle 30–330** evita los extremos (0° y 360° son visualmente iguales
 * y los muy cercanos a 0/180 generan composiciones aplastadas).
 *
 * **density 0.35–0.85** evita los extremos: <0.35 deja el canvas casi vacío,
 * >0.85 lo satura de capas. El rango cubre los "sweet spots" del motor.
 *
 * **Grain, contrast, vibrance** se fijan en defaults curados — eliminados de
 * la UI v2. Los valores conservan el look actual sin pedir input al usuario.
 *
 * Acepta un `rng` inyectable para tests deterministas.
 */

/** Defaults curados — congelan los sliders eliminados de la UI v2. */
export const CURATED_GRAIN = 32;
export const CURATED_CONTRAST = DEFAULT_CONTRAST; // 1.0 — identity
export const CURATED_VIBRANCE = 1.05; // sutil pop, sin sobreprocesado

/** Rango operativo de blur. El motor acepta más, pero >120 lava la composición. */
export const SURPRISE_BLUR_MIN = 30;
export const SURPRISE_BLUR_MAX = 90;

/** Rango operativo de light angle. Evita extremos aplastados. */
export const SURPRISE_LIGHT_MIN = 30;
export const SURPRISE_LIGHT_MAX = 330;

/** Rango operativo de density. Evita canvas vacío / saturado. */
export const SURPRISE_DENSITY_MIN = 0.35;
export const SURPRISE_DENSITY_MAX = 0.85;

interface StyleWeight {
  style: Style;
  weight: number;
}

const STYLE_WEIGHTS: readonly StyleWeight[] = [
  { style: "liquid", weight: 0.35 },
  { style: "mesh", weight: 0.3 },
  { style: "aurora", weight: 0.25 },
  { style: "nebula", weight: 0.1 },
];

/**
 * Sampleo weighted de style. Acumula los pesos y busca dónde cae `r`.
 */
export function pickWeightedStyle(rng: () => number = Math.random): Style {
  const r = rng();
  let acc = 0;
  for (const { style, weight } of STYLE_WEIGHTS) {
    acc += weight;
    if (r < acc) return style;
  }
  // Fallback por rounding — el último (nebula) si llegamos al final.
  return STYLE_WEIGHTS[STYLE_WEIGHTS.length - 1].style;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Genera un `GradientConfig` completo. Para tests deterministas, pasar `rng`
 * (un PRNG `() => number` que devuelve `[0, 1)`).
 *
 * @param prevSeed Seed actual (opcional). Si se pasa, el resultado tendrá un
 *                 seed distinto — garantiza que dos surprises consecutivos no
 *                 caen en el mismo wallpaper.
 * @param rng      PRNG opcional. Por defecto `Math.random`.
 */
export function generateSurprise(
  prevSeed?: number,
  rng: () => number = Math.random,
): GradientConfig {
  const seed =
    prevSeed === undefined ? pickCuratedSeed(rng) : pickCuratedSeedExcluding(prevSeed, rng);
  const colors: Colors4 = randomHarmonicColors(rng);
  const style = pickWeightedStyle(rng);
  const blur = Math.round(lerp(SURPRISE_BLUR_MIN, SURPRISE_BLUR_MAX, rng()));
  const lightAngle = Math.round(lerp(SURPRISE_LIGHT_MIN, SURPRISE_LIGHT_MAX, rng()));
  const density = lerp(SURPRISE_DENSITY_MIN, SURPRISE_DENSITY_MAX, rng());

  return {
    colors,
    style,
    blur,
    grain: CURATED_GRAIN,
    seed,
    lightAngle,
    density,
    contrast: CURATED_CONTRAST,
    vibrance: CURATED_VIBRANCE,
  };
}

/**
 * Variante determinista útil para "surprise reproducible" desde una URL
 * compartible (Fase futura): dado un seed maestro, el output es siempre el
 * mismo aunque cambie `Math.random`.
 */
export function generateSurpriseFromSeed(masterSeed: number): GradientConfig {
  return generateSurprise(undefined, mulberry32(masterSeed));
}
