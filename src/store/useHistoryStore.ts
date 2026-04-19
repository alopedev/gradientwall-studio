import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ActiveMask, GradientConfig } from "@/lib/palettes";

/**
 * A saved wallpaper config. `active` is optional so items persisted before
 * the per-slot mask landed still deserialize — the coordinator treats a
 * missing mask as "all four active".
 */
export type HistoryItem = GradientConfig & { active?: ActiveMask };

/**
 * Persisted archive of saved wallpaper configs. Only this store writes to
 * localStorage (key: `gw_history`). Mutation happens via the coordinator
 * which combines current-config with this archive.
 */
export interface HistoryState {
  history: HistoryItem[];
  // Internal setter used by the coordinator — not meant for direct UI use.
  _setHistory: (h: HistoryItem[]) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],
      _setHistory: (history) => set({ history }),
    }),
    {
      name: "gw_history",
      // Lazy-bind to the running env's localStorage so the module loads even
      // where no DOM is present (falls back to in-memory no-op).
      storage: createJSONStorage(() => {
        // Fall back to a no-op in-memory store when localStorage is absent or
        // broken (e.g. Node SSR). The runtime browser always has a real one.
        if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") return localStorage;
        const mem = new Map<string, string>();
        return {
          get length() {
            return mem.size;
          },
          clear: () => mem.clear(),
          getItem: (k) => mem.get(k) ?? null,
          key: (i) => [...mem.keys()][i] ?? null,
          removeItem: (k) => void mem.delete(k),
          setItem: (k, v) => void mem.set(k, String(v)),
        } satisfies Storage;
      }),
      partialize: (s) => ({ history: s.history }),
    },
  ),
);
