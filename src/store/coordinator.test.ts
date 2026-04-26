// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { save, loadHistoryItem, applyPalette } from "./coordinator";
import { useConfigStore } from "./useConfigStore";
import { useHistoryStore, type HistoryItem } from "./useHistoryStore";
import { useUIStore } from "./useUIStore";
import { ALL_ACTIVE, PALETTES, type ActiveMask, type Colors4 } from "@/lib/palettes";

const CONFIG_INITIAL = useConfigStore.getState();
const HISTORY_INITIAL = useHistoryStore.getState();
const UI_INITIAL = useUIStore.getState();

describe("coordinator", () => {
  beforeEach(() => {
    useConfigStore.setState(CONFIG_INITIAL, true);
    useHistoryStore.setState(HISTORY_INITIAL, true);
    useUIStore.setState(UI_INITIAL, true);
  });

  describe("save()", () => {
    it("prepends current config to history", () => {
      useConfigStore.setState({ style: "blobs", blur: 72, grain: 10, seed: 42 });
      save();
      const history = useHistoryStore.getState().history;
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({ style: "blobs", blur: 72, grain: 10, seed: 42 });
    });

    it("caps history at 12 items (oldest drops off)", () => {
      for (let i = 0; i < 15; i++) {
        useConfigStore.setState({ seed: i });
        save();
      }
      const history = useHistoryStore.getState().history;
      expect(history).toHaveLength(12);
      expect(history[0].seed).toBe(14); // most recent first
      expect(history[11].seed).toBe(3);
    });

    it("snapshots colors (mutations to config later do not affect saved item)", () => {
      useConfigStore.setState({ colors: ["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd"] as Colors4 });
      save();
      useConfigStore.getState().setColor(0, "#ffffff");
      expect(useHistoryStore.getState().history[0].colors[0]).toBe("#aaaaaa");
    });
  });

  describe("loadHistoryItem()", () => {
    it("writes all 5 config fields and leaves device/ui untouched", () => {
      const initialDevice = useConfigStore.getState().device;
      const initialTab = useUIStore.getState().activeTab;

      const item: HistoryItem = {
        colors: ["#111111", "#222222", "#333333", "#444444"] as Colors4,
        style: "liquid",
        blur: 90,
        grain: 33,
        seed: 7777,
      };
      loadHistoryItem(item);

      const c = useConfigStore.getState();
      expect(c.colors).toEqual(item.colors);
      expect(c.style).toBe("liquid");
      expect(c.blur).toBe(90);
      expect(c.grain).toBe(33);
      expect(c.seed).toBe(7777);
      expect(c.device).toBe(initialDevice); // preserved
      expect(useUIStore.getState().activeTab).toBe(initialTab); // preserved
    });
  });

  describe("applyPalette()", () => {
    it("applies an unlocked palette to config + marks it active in UI", () => {
      const unlockedIdx = PALETTES.findIndex((p) => !p.locked);
      applyPalette(unlockedIdx);
      expect(useConfigStore.getState().colors).toEqual(PALETTES[unlockedIdx].colors);
      expect(useUIStore.getState().activePalette).toBe(unlockedIdx);
    });

    it("is a no-op for locked palettes", () => {
      const beforeColors = useConfigStore.getState().colors;
      const beforeActive = useUIStore.getState().activePalette;
      const lockedIdx = PALETTES.findIndex((p) => p.locked);
      applyPalette(lockedIdx);
      expect(useConfigStore.getState().colors).toBe(beforeColors);
      expect(useUIStore.getState().activePalette).toBe(beforeActive);
    });

    it("is a no-op for out-of-range indices", () => {
      const beforeColors = useConfigStore.getState().colors;
      applyPalette(999);
      expect(useConfigStore.getState().colors).toBe(beforeColors);
    });
  });

  describe("active mask propagation", () => {
    it("save() snapshots the current active mask alongside colors", () => {
      useConfigStore.setState({ active: [true, false, true, true] });
      save();
      expect(useHistoryStore.getState().history[0].active).toEqual([true, false, true, true]);
    });

    it("loadHistoryItem() restores the item's active mask", () => {
      const item: HistoryItem = {
        colors: ["#111111", "#222222", "#333333", "#444444"] as Colors4,
        active: [false, true, true, false] as ActiveMask,
        style: "mesh",
        blur: 50,
        grain: 20,
        seed: 1,
      };
      loadHistoryItem(item);
      expect(useConfigStore.getState().active).toEqual([false, true, true, false]);
    });

    it("loadHistoryItem() falls back to ALL_ACTIVE when the item predates the mask", () => {
      // Simulate a history item persisted before the active-mask landed.
      const legacy: HistoryItem = {
        colors: ["#111111", "#222222", "#333333", "#444444"] as Colors4,
        style: "mesh",
        blur: 50,
        grain: 20,
        seed: 1,
      };
      useConfigStore.setState({ active: [false, true, false, true] });
      loadHistoryItem(legacy);
      expect(useConfigStore.getState().active).toEqual(ALL_ACTIVE);
    });

    it("applyPalette() resets the active mask to ALL_ACTIVE", () => {
      useConfigStore.setState({ active: [true, false, false, true] });
      const unlockedIdx = PALETTES.findIndex((p) => !p.locked);
      applyPalette(unlockedIdx);
      expect(useConfigStore.getState().active).toEqual(ALL_ACTIVE);
    });
  });
});
