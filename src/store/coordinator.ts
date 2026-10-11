import type { Look } from "@/lib/look";
import { type ActiveMask, ALL_ACTIVE, type Colors4, PALETTES } from "@/lib/palettes";
import { useConfigStore } from "./useConfigStore";
import { useLookHistoryStore } from "./useLookHistoryStore";

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
 *
 * Los gestos que reemplazan el wallpaper entero (`shuffleWallpaper`,
 * `remixWallpaper`, `applyPalette`, `loadLook`) apuntan antes el wallpaper
 * actual en `useLookHistoryStore`, para que ‹ del dock pueda volver a él.
 */

/**
 * Apply a curated palette. No-op for out-of-range indices. On success, writes
 * the colors to ConfigStore and resets the active mask to all-four so the
 * palette renders as designed.
 */
export function applyPalette(i: number): void {
  const p = PALETTES[i];
  if (!p) return;
  useLookHistoryStore.getState().record();
  useConfigStore.setState({
    colors: [...p.colors] as Colors4,
    active: [...ALL_ACTIVE] as ActiveMask,
  });
}

/** Shuffle: a new wallpaper, keeping the one it replaces one ‹ away. */
export function shuffleWallpaper(): void {
  useLookHistoryStore.getState().record();
  useConfigStore.getState().applySurprise();
}

/** Remix: a close variation of the current wallpaper, keeping the original one ‹ away. */
export function remixWallpaper(): void {
  useLookHistoryStore.getState().record();
  useConfigStore.getState().applyRemix();
}

/** Put a whole look on the stage (a saved wallpaper), keeping the one it replaces one ‹ away. */
export function loadLook(look: Look): void {
  useLookHistoryStore.getState().record();
  useConfigStore.setState(look);
}
