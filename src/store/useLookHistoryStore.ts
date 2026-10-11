import { create } from "zustand";
import { isSameLook, type Look, pickLook } from "@/lib/look";
import type { ActiveMask, Colors4 } from "@/lib/palettes";
import { useConfigStore } from "./useConfigStore";

/** How many wallpapers ‹ can walk back through. */
export const LOOK_HISTORY_LIMIT = 30;

/**
 * Wallpapers the visitor has left behind with a Shuffle, Remix, palette or saved
 * wallpaper, so ‹ and › can walk between them. The wallpaper on screen is not in
 * the list: it lives in `useConfigStore`, and `past` / `future` are what comes
 * before and after it. Ephemeral: gone on reload (saving is what keeps one).
 *
 * Call `record()` right before a gesture that replaces the wallpaper. Slider and
 * color-wheel drags do not record: a drag would fill the list with near copies.
 */
interface LookHistoryState {
  past: Look[];
  future: Look[];
  record: () => void;
  back: () => boolean;
  forward: () => boolean;
  canBack: () => boolean;
  canForward: () => boolean;
  clear: () => void;
}

/** A look that shares no arrays with the live store, so later edits can't change it. */
const snapshot = (look: Look): Look => ({
  ...look,
  colors: [...look.colors] as Colors4,
  active: [...look.active] as ActiveMask,
});

const current = (): Look => snapshot(pickLook(useConfigStore.getState()));

export const useLookHistoryStore = create<LookHistoryState>()((set, get) => ({
  past: [],
  future: [],
  record: () =>
    set(({ past }) => {
      const now = current();
      const last = past[past.length - 1];
      // The same wallpaper twice in a row would make ‹ look like it did nothing.
      if (last && isSameLook(last, now)) return { future: [] };
      return { past: [...past, now].slice(-LOOK_HISTORY_LIMIT), future: [] };
    }),
  back: () => {
    const { past, future } = get();
    const target = past[past.length - 1];
    if (!target) return false;
    set({ past: past.slice(0, -1), future: [current(), ...future] });
    useConfigStore.setState(snapshot(target));
    return true;
  },
  forward: () => {
    const { past, future } = get();
    const [target, ...rest] = future;
    if (!target) return false;
    set({ past: [...past, current()], future: rest });
    useConfigStore.setState(snapshot(target));
    return true;
  },
  canBack: () => get().past.length > 0,
  canForward: () => get().future.length > 0,
  clear: () => set({ past: [], future: [] }),
}));
