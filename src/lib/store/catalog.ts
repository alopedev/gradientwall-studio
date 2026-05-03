import { getPacks } from "../packs";

export type CatalogIssue =
  | { kind: "missing-variant"; slug: string }
  | { kind: "duplicate-slug"; slug: string }
  | { kind: "empty-previews"; slug: string }
  | { kind: "invalid-price"; slug: string; priceEur: number };

/**
 * Pre-launch sanity check over the static pack manifest. Warn-only by design:
 * during the pre-checkout phase the catalog legitimately ships with packs
 * that have no `lemonSqueezyVariantId` yet, and we don't want a missing
 * variant to break the build. Wired into `main.tsx` under `import.meta.env.DEV`
 * so it only logs in development.
 */
export function validateCatalog(): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const seen = new Set<string>();
  for (const pack of getPacks()) {
    if (seen.has(pack.slug)) {
      issues.push({ kind: "duplicate-slug", slug: pack.slug });
    } else {
      seen.add(pack.slug);
    }
    if (!pack.lemonSqueezyVariantId) {
      issues.push({ kind: "missing-variant", slug: pack.slug });
    }
    if (pack.previews.length === 0) {
      issues.push({ kind: "empty-previews", slug: pack.slug });
    }
    if (!Number.isFinite(pack.priceEur) || pack.priceEur <= 0) {
      issues.push({ kind: "invalid-price", slug: pack.slug, priceEur: pack.priceEur });
    }
  }
  return issues;
}
