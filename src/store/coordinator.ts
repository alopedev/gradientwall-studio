import { type ActiveMask, ALL_ACTIVE, type Colors4, PALETTES } from "@/lib/palettes";
import { useConfigStore } from "./useConfigStore";

/**
 * Cross-slice operations that touch more than one store. Plain functions —
 * not hooks — so they can be called from event handlers without subscribing
 * the caller to state changes.
 *
 * Tras el cutover Studio v2 (Fase 5) las operaciones legacy `save()`,
 * `loadHistoryItem()` y `removeHistoryItem()` se eliminaron junto con
 * `useHistoryStore` — su rol lo asumió `useFavoritesStore` con su API
 * propia (pin/unpin/reorder/clear) directamente desde el ActionRow.
 *
 * `applyPalette()` la usa `PaletteSwatches` para aplicar una palette curated.
 */

/**
 * Apply a curated palette. No-op for out-of-range indices. On success, writes
 * the colors to ConfigStore and resets the active mask to all-four so the
 * palette renders as designed.
 */
export function applyPalette(i: number): void {
  const p = PALETTES[i];
  if (!p) return;
  useConfigStore.setState({
    colors: [...p.colors] as Colors4,
    active: [...ALL_ACTIVE] as ActiveMask,
  });
}
