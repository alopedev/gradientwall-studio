/**
 * The hero's Shuffle also changes the look (Àlex chose option B, 2026-10-31):
 * a visitor who only taps Shuffle there would otherwise see one style forever.
 * Any look the engine offers, never the one on screen. The Studio's Shuffle
 * keeps the look the visitor picked.
 *
 * Pure: no React, no stores.
 */
export interface LookChoice {
  style: string;
  material?: string;
}

export function nextLookOption<T extends LookChoice>(
  options: readonly T[],
  current: LookChoice,
  rng: () => number = Math.random,
): T | null {
  const now = current.material ?? "none";
  const others = options.filter(
    (o) => !(o.style === current.style && (o.material ?? "none") === now),
  );
  if (others.length === 0) return null;
  return others[Math.min(others.length - 1, Math.floor(rng() * others.length))];
}
