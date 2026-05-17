/**
 * Lista de seeds curados para `generateSurprise` (Studio v2).
 *
 * El motor antiguo escogía `seed` con `Math.floor(Math.random() * 65535)` —
 * uniform random sobre todo el rango. Eso producía algunos outputs flojos
 * (paletas barrosas, composiciones desequilibradas). Esta capa restringe el
 * sampling a un conjunto que el equipo ha aprobado visualmente.
 *
 * La lista vive aquí (no en `palettes.ts`) porque es una decisión de la capa
 * de generación, no del motor matemático: `mulberry32(seed)` y
 * `buildGradientSpec` se respetan tal cual. Cualquier seed sigue siendo
 * legal; simplemente no lo elegimos al azar.
 *
 * **Cómo se compone**: 80 seeds distribuidos uniformemente en `[0, 65535]`
 * con un offset prime para evitar caer en múltiplos de 1024 (donde
 * `mulberry32` muestra patrones repetitivos en los primeros bytes).
 *
 * **Revisión visual pendiente**: marcar en `TASKS.md` Fase 1 que el listado
 * inicial es candidato y debe afinarse renderizando los 80 en una grid y
 * descartando los flojos. Esto requiere ojo humano y dev server corriendo.
 * Hasta entonces, la cobertura es suficiente para producir variedad real
 * porque cada surprise también randomiza paleta, style, light y density.
 */

const SEED_COUNT = 80;
const RANGE = 0x10000; // 65536

const buildCuratedSeeds = (): readonly number[] => {
  const step = Math.floor(RANGE / SEED_COUNT); // ~819
  const offset = 137; // prime to dodge multiples of 1024
  const seeds: number[] = [];
  for (let i = 0; i < SEED_COUNT; i++) {
    seeds.push((i * step + offset) & 0xffff);
  }
  return Object.freeze(seeds);
};

/**
 * 80 seeds aprobados (candidato — ver nota arriba sobre revisión visual).
 * `readonly` para que ningún caller pueda mutar la lista accidentalmente.
 */
export const CURATED_SEEDS: readonly number[] = buildCuratedSeeds();

/**
 * Elige uno de los seeds curados. Acepta un PRNG inyectable (`() => number`
 * que devuelve `[0, 1)`) para que los tests sean deterministas — sin
 * inyección, usa `Math.random`.
 *
 * @param rng PRNG opcional. Por defecto `Math.random`.
 * @returns Un seed del array `CURATED_SEEDS`.
 */
export function pickCuratedSeed(rng: () => number = Math.random): number {
  const i = Math.floor(rng() * CURATED_SEEDS.length);
  return CURATED_SEEDS[i];
}

/**
 * Variante que excluye un seed (el actual, típicamente) para garantizar que
 * dos surprises consecutivos no caigan en el mismo wallpaper. Si la lista
 * tiene un solo elemento devuelve ese (no debería pasar con 80).
 */
export function pickCuratedSeedExcluding(exclude: number, rng: () => number = Math.random): number {
  if (CURATED_SEEDS.length <= 1) return CURATED_SEEDS[0];
  let next = pickCuratedSeed(rng);
  // Loop hasta encontrar uno distinto. Vuelta máxima limitada por longitud
  // para evitar un bucle infinito en casos patológicos (rng degenerado).
  for (let guard = 0; guard < CURATED_SEEDS.length * 2 && next === exclude; guard++) {
    next = pickCuratedSeed(rng);
  }
  return next;
}
