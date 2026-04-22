/** Lógica pura del mouse-trail: throttle, rotación y selección de pool. */

export function computeSpawn(a: { lastSpawnTs: number; now: number; minInterval: number }): boolean {
  return a.now - a.lastSpawnTs >= a.minInterval;
}

/** Rotación uniforme en [-10, 10] grados. */
export function randomRotation(rng: () => number): number {
  return rng() * 20 - 10;
}

/** Índice entero uniforme en [0, size). */
export function pickPoolIndex(rng: () => number, size: number): number {
  return Math.floor(rng() * size);
}
