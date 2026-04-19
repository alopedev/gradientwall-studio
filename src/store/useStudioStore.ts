import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PALETTES, type Colors4, type Device, type GallerySeed, type Style } from "@/lib/palettes";
import { randomColors } from "@/lib/gradient";

export interface HistoryItem {
  colors: Colors4;
  style: Style;
  blur: number;
  grain: number;
  seed: number;
}

export type SourceTab = "picker" | "palettes";

interface StudioState {
  // state
  device: Device;
  colors: Colors4;
  style: Style;
  blur: number;
  grain: number;
  seed: number;
  activeTab: SourceTab;
  activePalette: number;
  history: HistoryItem[];

  // actions
  setDevice: (d: Device) => void;
  setColor: (i: number, hex: string) => void;
  setStyle: (s: Style) => void;
  setBlur: (n: number) => void;
  setGrain: (n: number) => void;
  setActiveTab: (t: SourceTab) => void;
  applyPalette: (i: number) => void;
  reshuffle: () => void;
  randomize: () => void;
  save: () => void;
  loadHistory: (h: HistoryItem) => void;
  loadGallerySeed: (g: GallerySeed) => void;
}

const randomSeed = () => Math.floor(Math.random() * 65535);

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      device: "mobile",
      colors: [...PALETTES[0].colors] as Colors4,
      style: "mesh",
      blur: 48,
      grain: 45,
      seed: randomSeed(),
      activeTab: "picker",
      activePalette: 0,
      history: [],

      setDevice: (d) => set({ device: d }),
      setColor: (i, hex) =>
        set((s) => {
          const next = [...s.colors] as Colors4;
          next[i] = hex;
          return { colors: next };
        }),
      setStyle: (s) => set({ style: s }),
      setBlur: (n) => set({ blur: n }),
      setGrain: (n) => set({ grain: n }),
      setActiveTab: (t) => set({ activeTab: t }),

      applyPalette: (i) => {
        const p = PALETTES[i];
        if (!p || p.locked) return;
        set({ activePalette: i, colors: [...p.colors] as Colors4 });
      },

      reshuffle: () => set({ seed: randomSeed() }),

      randomize: () => {
        const styles: Style[] = ["mesh", "blobs", "liquid"];
        set({
          colors: randomColors(),
          style: styles[Math.floor(Math.random() * styles.length)],
          seed: randomSeed(),
        });
      },

      save: () => {
        const { colors, style, blur, grain, seed, history } = get();
        const next = [{ colors: [...colors] as Colors4, style, blur, grain, seed }, ...history].slice(0, 12);
        set({ history: next });
      },

      loadHistory: (h) =>
        set({
          colors: [...h.colors] as Colors4,
          style: h.style,
          blur: h.blur,
          grain: h.grain,
          seed: h.seed,
        }),

      loadGallerySeed: (g) =>
        set({
          colors: [...g.colors] as Colors4,
          style: g.style,
          seed: g.seed,
          blur: 55,
        }),
    }),
    {
      name: "gw_history",
      partialize: (state) => ({ history: state.history }),
    },
  ),
);
