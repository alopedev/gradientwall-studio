import packsData from "@/data/packs.json";
import { PACK_STYLES, type Pack, type PackCover, type PackStyle } from "./types";

export type { Pack, PackCover, PackImage, PackStyle } from "./types";
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

/** Distinct styles present in the catalog, in canonical order (PACK_STYLES). */
export function availableStyles(): PackStyle[] {
  const present = new Set(PACKS.map((p) => p.style));
  return PACK_STYLES.filter((s) => present.has(s));
}

/** Box used for covers that don't declare a size (gradients, images without width/height). */
const DEFAULT_ASPECT = 3 / 4;

/** Width ÷ height of what the cover's primary file shows. */
export function coverAspect(cover: PackCover): number {
  if (cover.kind === "image" && cover.width && cover.height) return cover.width / cover.height;
  return DEFAULT_ASPECT;
}

/**
 * Width ÷ height to reserve for a piece in the pack page grid. A piece that
 * ships a desktop render is shown by that landscape render.
 */
export function pieceAspect(piece: PackCover): number {
  if (piece.kind === "image" && piece.desktop?.width && piece.desktop.height) {
    return piece.desktop.width / piece.desktop.height;
  }
  return coverAspect(piece);
}

/** "6 wallpapers · phone + desktop" — what a buyer gets, derived from the manifest. */
export function describeContents(pack: Pick<Pack, "previews">): string {
  const n = pack.previews.length;
  const noun = n === 1 ? "wallpaper" : "wallpapers";
  const paired = pack.previews.some((p) => p.kind === "image" && p.desktop);
  return paired ? `${n} ${noun} · phone + desktop` : `${n} ${noun}`;
}
