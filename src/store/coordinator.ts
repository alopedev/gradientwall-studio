import { ALL_ACTIVE, PALETTES, type ActiveMask, type Colors4 } from "@/lib/palettes";
import { useConfigStore } from "./useConfigStore";
import { useHistoryStore, type HistoryItem } from "./useHistoryStore";
import { useUIStore } from "./useUIStore";

/**
 * Cross-slice operations that touch more than one store. Plain functions —
 * not hooks — so they can be called from event handlers without subscribing
 * the caller to state changes. Each reads/writes via the vanilla
 * `useX.getState()` / `.setState()` API, making them trivially testable.
 */

const MAX_HISTORY = 12;

/** Snapshot the current config and prepend it to history (capped at 12). */
export function save(): void {
  const { colors, active, style, blur, grain, seed } = useConfigStore.getState();
  const { history, _setHistory } = useHistoryStore.getState();
  const item: HistoryItem = {
    colors: [...colors] as Colors4,
    active: [...active] as ActiveMask,
    style,
    blur,
    grain,
    seed,
  };
  _setHistory([item, ...history].slice(0, MAX_HISTORY));
}

/**
 * Load a history item back into the current config. Does not touch UI.
 * Items saved before the per-slot mask landed have no `active` field — those
 * restore with every slot active so legacy thumbnails keep their look.
 */
export function loadHistoryItem(h: HistoryItem): void {
  useConfigStore.setState({
    colors: [...h.colors] as Colors4,
    active: [...(h.active ?? ALL_ACTIVE)] as ActiveMask,
    style: h.style,
    blur: h.blur,
    grain: h.grain,
    seed: h.seed,
  });
}

/**
 * Drop the history item at `index`. Out-of-range indices are silently
 * ignored. Does not touch the live config — the user can keep working on
 * whatever they're editing while pruning the archive.
 */
export function removeHistoryItem(index: number): void {
  const { history, _setHistory } = useHistoryStore.getState();
  if (index < 0 || index >= history.length) return;
  _setHistory(history.filter((_, i) => i !== index));
}

/**
 * Apply a curated palette. No-op for out-of-range indices. On success, writes
 * colors to ConfigStore AND marks the palette as active in UIStore. The
 * active mask resets to all-four so the palette renders as designed.
 */
export function applyPalette(i: number): void {
  const p = PALETTES[i];
  if (!p) return;
  useConfigStore.setState({
    colors: [...p.colors] as Colors4,
    active: [...ALL_ACTIVE] as ActiveMask,
  });
  useUIStore.getState()._setActivePalette(i);
}
