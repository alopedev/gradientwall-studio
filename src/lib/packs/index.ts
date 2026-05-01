import packsData from "@/data/packs.json";
import type { Pack, PackStyle } from "./types";

export type { Pack, PackCover, PackStyle } from "./types";
export { PACK_STYLES } from "./types";

// JSON imports lose type-narrowness on the discriminated union — cast at the
// boundary, then trust downstream. Schema discipline lives in tests.
const PACKS: Pack[] = packsData as Pack[];

/** All packs in declared order (manifest = source of truth, no sort). */
export function getPacks(): Pack[] {
  return PACKS;
}

/**
 * The single editorial flagship pack, if any. Returns the FIRST `featured`
 * pack — additional flags are intentionally ignored. Callers use this to
 * promote a pack to the 2×2 hero slot in the Bento layout. When no pack
 * carries the flag, returns `undefined` and callers fall back to the
 * uniform grid.
 */
export function featuredPack(): Pack | undefined {
  return PACKS.find((p) => p.featured);
}

/** Lookup by slug. Returns undefined for unknown slugs. */
export function getPackBySlug(slug: string): Pack | undefined {
  return PACKS.find((p) => p.slug === slug);
}

/**
 * Filter by technical style. Pass `null` (or omit) to get all packs — the
 * "All" pill on the filters bar resolves to that.
 */
export function filterPacks(style: PackStyle | null | undefined): Pack[] {
  if (!style) return PACKS;
  return PACKS.filter((p) => p.style === style);
}

/** Distinct styles present in the catalog, in canonical order. */
export function availableStyles(): PackStyle[] {
  const present = new Set(PACKS.map((p) => p.style));
  // Preserve PACK_STYLES canonical order; only return ones that have packs.
  const order: PackStyle[] = ["gradient", "acrylic", "fluted", "photo"];
  return order.filter((s) => present.has(s));
}
