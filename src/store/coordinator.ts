import { PALETTES, type Colors4, type GallerySeed } from "@/lib/palettes";
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
  const { colors, style, blur, grain, seed } = useConfigStore.getState();
  const { history, _setHistory } = useHistoryStore.getState();
  const item: HistoryItem = { colors: [...colors] as Colors4, style, blur, grain, seed };
  _setHistory([item, ...history].slice(0, MAX_HISTORY));
}

/** Load a history item back into the current config. Does not touch UI. */
export function loadHistoryItem(h: HistoryItem): void {
  useConfigStore.setState({
    colors: [...h.colors] as Colors4,
    style: h.style,
    blur: h.blur,
    grain: h.grain,
    seed: h.seed,
  });
}

/**
 * Load a gallery seed into the current config. Blur is forced to 55 (the
 * gallery cards were rendered with that value — keep the "feel" consistent
 * when the user opens one).
 */
export function loadGallerySeed(g: GallerySeed): void {
  useConfigStore.setState({
    colors: [...g.colors] as Colors4,
    style: g.style,
    seed: g.seed,
    blur: 55,
  });
}

/**
 * Apply a curated palette. No-op for locked palettes. On success, writes
 * colors to ConfigStore AND marks the palette as active in UIStore.
 */
export function applyPalette(i: number): void {
  const p = PALETTES[i];
  if (!p || p.locked) return;
  useConfigStore.setState({ colors: [...p.colors] as Colors4 });
  useUIStore.getState()._setActivePalette(i);
}
