import packsData from "../../../src/data/packs.json";

/**
 * Server-side view of the pack catalog. The manifest at `src/data/packs.json`
 * is the single source of truth; the backend only needs three fields from it.
 *
 * The point of this module is that the webhook never trusts anything the
 * buyer can edit (the checkout URL's `custom_data`): what was paid for is
 * identified by the Lemon Squeezy variant, which only we can map to a pack.
 */
export interface CatalogPack {
  slug: string;
  name: string;
  /** Lemon Squeezy variant ID, as a string (LS sends it as a number). */
  variantId: string;
}

export interface Catalog {
  /** Pack bought with this LS variant, or null if no pack maps to it. */
  byVariant(variantId: string | number | null | undefined): CatalogPack | null;
  /** Pack with this slug, or null. Only packs that are on sale are listed. */
  bySlug(slug: string): CatalogPack | null;
}

/**
 * Build a catalog from raw manifest entries. Entries without a variant ID are
 * not on sale yet and are left out. Malformed entries are skipped. A duplicate
 * slug or variant ID throws: silently picking one would hand a buyer the wrong
 * pack.
 */
export function buildCatalog(entries: unknown): Catalog {
  const byVariant = new Map<string, CatalogPack>();
  const bySlug = new Map<string, CatalogPack>();

  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || typeof entry !== "object") continue;
    const { slug, name, lemonSqueezyVariantId } = entry as Record<string, unknown>;
    if (typeof slug !== "string" || slug === "") continue;
    if (typeof name !== "string" || name === "") continue;
    if (lemonSqueezyVariantId == null || lemonSqueezyVariantId === "") continue;
    const variantId = String(lemonSqueezyVariantId);

    if (bySlug.has(slug)) throw new Error(`Catalog has a duplicate slug: ${slug}`);
    if (byVariant.has(variantId)) {
      throw new Error(`Catalog has a duplicate Lemon Squeezy variant ID: ${variantId}`);
    }
    const pack: CatalogPack = { slug, name, variantId };
    bySlug.set(slug, pack);
    byVariant.set(variantId, pack);
  }

  return {
    byVariant: (variantId) =>
      variantId == null ? null : (byVariant.get(String(variantId)) ?? null),
    bySlug: (slug) => bySlug.get(slug) ?? null,
  };
}

let defaultCatalog: Catalog | undefined;

/** Catalog built from the bundled manifest. Built lazily, once per instance. */
export function getCatalog(): Catalog {
  defaultCatalog ??= buildCatalog(packsData);
  return defaultCatalog;
}
