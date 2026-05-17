import { create } from "zustand";
import { pushRecent } from "@/lib/recent-colors";

/**
 * Reactive shell around the pure `pushRecent` ring-buffer. The algorithm
 * (cap, dedup, normalization, immutability) lives in `src/lib/recent-colors.ts`
 * — this store is intentionally thin. New algorithmic concerns belong in the
 * pure module, not here.
 *
 * Convenience hooks (`useRecentColors`, `usePushRecentColor`) cover the
 * common selectors. For other selections, components consume the store
 * directly via `useRecentColorsStore((s) => ...)`.
 */
export interface RecentColorsState {
  items: string[];
  push: (hex: string) => void;
  /** Test/debug only — drop everything. Production callers don't need this. */
  reset: () => void;
}

export const useRecentColorsStore = create<RecentColorsState>()((set) => ({
  items: [],
  push: (hex) => set((s) => ({ items: pushRecent(s.items, hex) })),
  reset: () => set({ items: [] }),
}));

export const useRecentColors = (): readonly string[] => useRecentColorsStore((s) => s.items);
export const usePushRecentColor = (): ((hex: string) => void) =>
  useRecentColorsStore((s) => s.push);
