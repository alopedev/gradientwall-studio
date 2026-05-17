import { useConfigStore } from "@/store/useConfigStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useRecentColorsStore } from "@/store/useRecentColorsStore";
import { useUIStore } from "@/store/useUIStore";

const CONFIG_INITIAL = useConfigStore.getState();
const UI_INITIAL = useUIStore.getState();
const RECENT_COLORS_INITIAL = useRecentColorsStore.getState();

/**
 * Reset every store to its pristine post-init state.
 * Use in beforeEach() to isolate tests.
 *
 * Tras el cutover Studio v2 (Fase 5), `useHistoryStore` se eliminó; los
 * favoritos persistidos se limpian vía `clear()` (no necesita snapshot
 * inicial porque el estado base es { items: [] }).
 */
export function resetStores(): void {
  useConfigStore.setState(CONFIG_INITIAL);
  useUIStore.setState(UI_INITIAL);
  useRecentColorsStore.setState(RECENT_COLORS_INITIAL);
  useFavoritesStore.getState().clear();
}

/**
 * Yield until the next animation frame fires. Used to flush rAF-batched
 * setters (setBlur, setGrain, setLightAngle, setDensity) before reading
 * state in tests.
 */
export const flushRaf = (): Promise<void> =>
  new Promise<void>((r) => requestAnimationFrame(() => r()));
