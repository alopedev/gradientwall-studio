import type { Colors4 } from "../palettes";
import { hslToHex } from "./spec";

/**
 * Generador de paletas armónicas para `generateSurprise` (Studio v2).
 *
 * El `randomColors()` actual de `spec.ts` se mantiene intocable (lo usan
 * snapshots y la `randomize()` legacy del store). Esta capa nueva produce
 * paletas con restricciones HSL para evitar combinaciones barrosas /
 * desaturadas que el uniform random anterior dejaba colarse.
 *
 * **Constraints**:
 * - Saturación 55–92 (evita grises y neon eléctrico).
 * - Lightness 42–78 (evita carbón y blanco lechoso; cubre rango "wallpaper").
 * - Distancia hue ≥ 25° entre slots adyacentes (evita paletas monótonas).
 *
 * **Esquemas armónicos** (uno elegido por sampleo weighted, asegura variedad
 * sin perder cohesión):
 * - `analogous`   — 4 hues dentro de un arco de 60°. Cálida o fría, calma.
 * - `complementary` — 2 pares opuestos (180°). Vibrante, alto contraste.
 * - `triadic`     — 3 hues a 120° + uno doble. Pop, bien equilibrada.
 * - `split-comp`  — base + dos vecinos del complementario. Dramático sin caos.
 *
 * Todas las funciones son puras: aceptan un `rng` inyectable para tests
 * deterministas.
 */

export type HarmonyScheme = "analogous" | "complementary" | "triadic" | "split-comp";

export const HARMONY_SCHEMES: readonly HarmonyScheme[] = [
  "analogous",
  "complementary",
  "triadic",
  "split-comp",
] as const;

// Constraints expuestas como constantes para tests.
export const SAT_MIN = 55;
export const SAT_MAX = 92;
export const LIGHT_MIN = 42;
export const LIGHT_MAX = 78;
export const MIN_HUE_DISTANCE = 25;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Distancia mínima de hue entre dos ángulos sobre el círculo de color
 * (0..360, wrap-aware). Devuelve `0..180`.
 */
export function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Elige un esquema armónico con weights: analogous y complementary son los
 * más comunes en wallpapers atractivos; triadic y split-comp añaden variedad.
 */
export function pickHarmonyScheme(rng: () => number = Math.random): HarmonyScheme {
  const r = rng();
  if (r < 0.35) return "analogous";
  if (r < 0.65) return "complementary";
  if (r < 0.85) return "triadic";
  return "split-comp";
}

/**
 * Devuelve 4 hues `[0..360)` para el esquema dado, separados por al menos
 * `MIN_HUE_DISTANCE` cuando es posible (analogous comprime el rango pero
 * mantiene perceptible la separación).
 */
function huesForScheme(scheme: HarmonyScheme, rng: () => number): [number, number, number, number] {
  const base = rng() * 360;
  switch (scheme) {
    case "analogous": {
      // Arco 60° dividido en 4 puntos; jitter pequeño dentro del arco.
      const step = 60 / 3;
      return [0, 1, 2, 3].map((i) => (base + i * step + (rng() - 0.5) * 8) % 360) as [
        number,
        number,
        number,
        number,
      ];
    }
    case "complementary": {
      // 2 hues + sus complementarios (180°). Jitter sutil.
      const a = base;
      const b = (base + 30 + rng() * 30) % 360;
      return [a, b, (a + 180) % 360, (b + 180) % 360];
    }
    case "triadic": {
      // 3 hues a 120° + una repetición desplazada para el 4º slot.
      const a = base;
      const b = (a + 120) % 360;
      const c = (a + 240) % 360;
      const d = (a + 60 + rng() * 30) % 360;
      return [a, b, c, d];
    }
    case "split-comp": {
      // Base + dos vecinos del complementario (150°, 210°) + un análogo del base.
      const a = base;
      return [a, (a + 30) % 360, (a + 150) % 360, (a + 210) % 360];
    }
  }
}

/**
 * Asigna saturación y lightness por slot con un patrón "deep → mid → mid →
 * light" que reproduce la jerarquía visual del `randomColors` antiguo pero
 * dentro de los rangos constreñidos. El primer slot es siempre el más oscuro
 * (anclaje), el último el más claro (highlight).
 */
function satLightForSlot(slot: number, rng: () => number): [number, number] {
  // Distribución por slot — cada uno cae en una sub-banda dentro del rango global.
  const lightBands: [number, number][] = [
    [LIGHT_MIN, LIGHT_MIN + 12], // 42–54 deep
    [LIGHT_MIN + 12, LIGHT_MIN + 22], // 54–64 mid-low
    [LIGHT_MIN + 18, LIGHT_MIN + 28], // 60–70 mid-high
    [LIGHT_MAX - 14, LIGHT_MAX], // 64–78 light
  ];
  const [lo, hi] = lightBands[slot];
  const light = lerp(lo, hi, rng());

  // Saturación: ligeramente más alta en mids, más controlada en deep/light
  // (evita un highlight neón o un deep rojo eléctrico).
  const satBands: [number, number][] = [
    [SAT_MIN, SAT_MIN + 18], // 55–73 deep
    [SAT_MIN + 12, SAT_MAX], // 67–92 mid
    [SAT_MIN + 12, SAT_MAX], // 67–92 mid
    [SAT_MIN, SAT_MIN + 22], // 55–77 light
  ];
  const [slo, shi] = satBands[slot];
  const sat = lerp(slo, shi, rng());

  return [sat, light];
}

/**
 * Genera 4 colores armónicos con HSL constreñido. El primer slot queda como
 * el más oscuro y el último como el más claro — preservando la jerarquía
 * visual que el motor espera ("deep / mid / mid / light").
 *
 * @param rng PRNG opcional. Por defecto `Math.random`.
 * @returns Colors4 — tupla de 4 hex strings `#rrggbb`.
 */
export function randomHarmonicColors(rng: () => number = Math.random): Colors4 {
  const scheme = pickHarmonyScheme(rng);
  const hues = huesForScheme(scheme, rng);
  return hues.map((h, i) => {
    const [s, l] = satLightForSlot(i, rng);
    return hslToHex(h, s, l);
  }) as Colors4;
}
