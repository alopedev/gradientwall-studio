import { create } from "zustand";
import { PALETTES, STYLES, type Colors4, type Device, type GradientConfig, type Style } from "@/lib/palettes";
import { randomColors } from "@/lib/gradient";

/**
 * Current wallpaper configuration — the "what the studio is showing right now".
 * Ephemeral (not persisted). Direct mutations from UI sliders / device pills.
 */
export interface ConfigState extends GradientConfig {
  device: Device;
  setDevice: (d: Device) => void;
  setColors: (colors: Colors4) => void;
  setColor: (i: number, hex: string) => void;
  setStyle: (s: Style) => void;
  setBlur: (n: number) => void;
  setGrain: (n: number) => void;
  reshuffle: () => void;
  randomize: () => void;
}

const randomSeed = () => Math.floor(Math.random() * 65535);

export const useConfigStore = create<ConfigState>()((set) => ({
  device: "mobile",
  colors: [...PALETTES[0].colors] as Colors4,
  style: "mesh",
  blur: 48,
  grain: 45,
  seed: randomSeed(),

  setDevice: (d) => set({ device: d }),
  setColors: (colors) => set({ colors: [...colors] as Colors4 }),
  setColor: (i, hex) =>
    set((s) => {
      const next = [...s.colors] as Colors4;
      next[i] = hex;
      return { colors: next };
    }),
  setStyle: (s) => set({ style: s }),
  setBlur: (n) => set({ blur: n }),
  setGrain: (n) => set({ grain: n }),
  reshuffle: () => set({ seed: randomSeed() }),
  randomize: () =>
    set({
      colors: randomColors(),
      style: STYLES[Math.floor(Math.random() * STYLES.length)],
      seed: randomSeed(),
    }),
}));
