// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { save, loadHistoryItem, loadGallerySeed, applyPalette } from "./coordinator";
import { useConfigStore } from "./useConfigStore";
import { useHistoryStore, type HistoryItem } from "./useHistoryStore";
import { useUIStore } from "./useUIStore";
import { PALETTES, type Colors4, type GallerySeed } from "@/lib/palettes";

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

  describe("loadGallerySeed()", () => {
    it("applies colors/style/seed and forces blur to 55", () => {
      const g: GallerySeed = {
        colors: ["#1a0b2e", "#5b2a86", "#f59e0b", "#fce5b7"] as Colors4,
        style: "mesh",
        seed: 12,
        author: "ani·k",
        name: "Amber dusk",
      };
      loadGallerySeed(g);
      const c = useConfigStore.getState();
      expect(c.colors).toEqual(g.colors);
      expect(c.style).toBe("mesh");
      expect(c.seed).toBe(12);
      expect(c.blur).toBe(55);
    });

    it("does not write to history or UI stores", () => {
      const beforeHistory = useHistoryStore.getState().history;
      const beforeUI = useUIStore.getState();
      loadGallerySeed({
        colors: ["#000", "#111", "#222", "#333"] as Colors4,
        style: "blobs",
        seed: 1,
        author: "x",
        name: "y",
      });
      expect(useHistoryStore.getState().history).toBe(beforeHistory);
      expect(useUIStore.getState()).toEqual(beforeUI);
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
});
