import { create } from "zustand";

export type SourceTab = "picker" | "palettes" | "image";

/**
 * Ephemeral selection state for the studio shell — which source tab is
 * open and which palette card is currently active. Cross-slice writes
 * (e.g. the coordinator updating `activePalette` when applyPalette
 * succeeds) use the underscore-prefixed `_setActivePalette` to make the
 * intent explicit.
 *
 * Recent-color history was extracted to `src/store/useRecentColorsStore.ts`
 * (algorithm in `src/lib/recent-colors.ts`) — this store is intentionally
 * narrow. Add a new field here only when it's "selection state for the
 * studio shell" with no algorithmic concern of its own.
 */
export interface UIState {
  activeTab: SourceTab;
  activePalette: number;
  setActiveTab: (t: SourceTab) => void;
  _setActivePalette: (i: number) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeTab: "palettes",
  activePalette: 0,
  setActiveTab: (activeTab) => set({ activeTab }),
  _setActivePalette: (activePalette) => set({ activePalette }),
}));
