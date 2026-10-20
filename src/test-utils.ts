import { useConfigStore } from "@/store/useConfigStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";

const CONFIG_INITIAL = useConfigStore.getState();

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
  useFavoritesStore.getState().clear();
}

/**
 * Yield until the next animation frame fires. Used to flush rAF-batched
 * setters (setBlur, setGrain, setLightAngle) before reading
 * state in tests.
 */
export const flushRaf = (): Promise<void> =>
  new Promise<void>((r) => requestAnimationFrame(() => r()));
