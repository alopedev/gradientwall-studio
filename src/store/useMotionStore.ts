import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Whether the visitor paused the moving wallpaper (the hero phone's float and
 * the drift on the hero and Studio screens). WCAG 2.2.2: motion that starts by
 * itself and lasts more than 5 s needs a way to pause it. Remembered under
 * `gw:motion:v1`.
 */
interface MotionState {
  paused: boolean;
  togglePaused: () => void;
}

export const useMotionStore = create<MotionState>()(
  persist(
    (set) => ({
      paused: false,
      togglePaused: () => set((s) => ({ paused: !s.paused })),
    }),
    {
      name: "gw:motion:v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ paused: s.paused }),
    },
  ),
);
