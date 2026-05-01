import { useConfigStore } from "@/store/useConfigStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useUIStore } from "@/store/useUIStore";
import { useRecentColorsStore } from "@/store/useRecentColorsStore";

const CONFIG_INITIAL = useConfigStore.getState();
const HISTORY_INITIAL = useHistoryStore.getState();
const UI_INITIAL = useUIStore.getState();
const RECENT_COLORS_INITIAL = useRecentColorsStore.getState();

/**
 * Reset every store to its pristine post-init state.
 * Use in beforeEach() to isolate tests.
 */
export function resetStores(): void {
  useConfigStore.setState(CONFIG_INITIAL);
  useHistoryStore.setState(HISTORY_INITIAL);
  useUIStore.setState(UI_INITIAL);
  useRecentColorsStore.setState(RECENT_COLORS_INITIAL);
}
