import { create } from "zustand";

export type SourceTab = "picker" | "palettes" | "image";

const RECENT_COLORS_CAP = 12;

/**
 * Ephemeral UI state for the studio controls (which tab is active, which
 * palette card is selected, recently picked colors). Not persisted. Cross-
 * slice writes (e.g. the coordinator updating `activePalette` when applyPalette
 * succeeds) use `_setActivePalette` to make the intent clear.
 */
export interface UIState {
  activeTab: SourceTab;
  activePalette: number;
  /**
   * Ring buffer of the last {@link RECENT_COLORS_CAP} colors picked by the
   * user from the ColorHUD. Most-recent first. Surfaced as a row of chips
   * inside the HUD so the user can re-apply a color across slots without
   * re-typing it.
   */
  recentColors: string[];
  setActiveTab: (t: SourceTab) => void;
  _setActivePalette: (i: number) => void;
  pushRecentColor: (hex: string) => void;
}

const normalize = (hex: string): string => {
  const trimmed = hex.trim().replace(/^#/, "").toUpperCase();
  return "#" + trimmed;
};

export const useUIStore = create<UIState>()((set) => ({
  activeTab: "picker",
  activePalette: 0,
  recentColors: [],
  setActiveTab: (activeTab) => set({ activeTab }),
  _setActivePalette: (activePalette) => set({ activePalette }),
  pushRecentColor: (hex) =>
    set((state) => {
      const norm = normalize(hex);
      const next = [norm, ...state.recentColors.filter((c) => c !== norm)].slice(0, RECENT_COLORS_CAP);
      return { recentColors: next };
    }),
}));
