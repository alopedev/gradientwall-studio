/**
 * Pure ring-buffer for "recently picked colors" — no React, no zustand,
 * no module-level mutable state. The reactive shell that wraps this lives
 * at `src/store/useRecentColorsStore.ts`.
 *
 * This is the "deep module" boundary: the algorithm and its invariants
 * live here; consumers see only `pushRecent` + `normalizeHex` + the cap.
 * Switching the algorithm (e.g. expiry, Set-based dedup, weighted recency)
 * is one file change.
 */

export const RECENT_COLORS_CAP = 12;

/** Canonicalize a hex string to `#RRGGBB` (uppercase, hash-prefixed). */
export function normalizeHex(hex: string): string {
  return "#" + hex.trim().replace(/^#/, "").toUpperCase();
}

/**
 * Push `hex` onto the front of `items`, dedup-by-uppercase, cap at
 * {@link RECENT_COLORS_CAP}. Always returns a NEW array; never mutates
 * input.
 *
 * Invariants:
 *   - `result[0] === normalizeHex(hex)`
 *   - `result.length <= RECENT_COLORS_CAP`
 *   - every entry is unique (no duplicates)
 *   - every entry matches `/^#[0-9A-F]{6}$/` only when input is well-formed;
 *     malformed input produces an entry with the same shape but undefined
 *     content (callers validate upstream).
 */
export function pushRecent(items: readonly string[], hex: string): string[] {
  const norm = normalizeHex(hex);
  return [norm, ...items.filter((c) => c !== norm)].slice(0, RECENT_COLORS_CAP);
}
