import { create } from "zustand";

export type SourceTab = "picker" | "palettes" | "image";

/**
 * Ephemeral UI state for the studio controls (which tab is active, which
 * palette card is selected). Not persisted. Cross-slice writes (e.g. the
 * coordinator updating `activePalette` when applyPalette succeeds) use
 * `_setActivePalette` to make the intent clear.
 */
export interface UIState {
  activeTab: SourceTab;
  activePalette: number;
  setActiveTab: (t: SourceTab) => void;
  _setActivePalette: (i: number) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeTab: "picker",
  activePalette: 0,
  setActiveTab: (activeTab) => set({ activeTab }),
  _setActivePalette: (activePalette) => set({ activePalette }),
}));
