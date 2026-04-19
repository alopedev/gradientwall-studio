import { create } from "zustand";
import {
  ALL_ACTIVE,
  MIN_ACTIVE_COLORS,
  PALETTES,
  STYLES,
  type ActiveMask,
  type Colors4,
  type Device,
  type GradientConfig,
  type Style,
} from "@/lib/palettes";
import { randomColors } from "@/lib/gradient";

/**
 * Current wallpaper configuration — the "what the studio is showing right now".
 * Ephemeral (not persisted). Direct mutations from UI sliders / device pills.
 */
export interface ConfigState extends GradientConfig {
  device: Device;
  /**
   * Per-slot on/off over the four colors. A `false` entry removes that slot
   * from the rendered ramp so the wallpaper uses 2 or 3 colors instead of 4.
   * Always kept in sync with `colors`: replacing the palette (setColors,
   * randomize, applyPalette, gallery load) snaps the mask back to all-true.
   */
  active: ActiveMask;
  setDevice: (d: Device) => void;
  setColors: (colors: Colors4) => void;
  setColor: (i: number, hex: string) => void;
  /**
   * Flip slot `i`. Refuses to drop below MIN_ACTIVE_COLORS — below two the
   * "gradient" collapses visually, so the UI is also expected to disable the
   * × button on the last two active slots.
   */
  toggleColor: (i: number) => void;
  setStyle: (s: Style) => void;
  setBlur: (n: number) => void;
  setGrain: (n: number) => void;
  reshuffle: () => void;
  randomize: () => void;
}

const randomSeed = () => Math.floor(Math.random() * 65535);
const freshMask = (): ActiveMask => [...ALL_ACTIVE] as ActiveMask;

export const useConfigStore = create<ConfigState>()((set) => ({
  device: "mobile",
  colors: [...PALETTES[0].colors] as Colors4,
  active: freshMask(),
  style: "mesh",
  blur: 48,
  grain: 45,
  seed: randomSeed(),

  setDevice: (d) => set({ device: d }),
  // A fresh palette invalidates any per-slot deactivation — reset the mask.
  setColors: (colors) => set({ colors: [...colors] as Colors4, active: freshMask() }),
  setColor: (i, hex) =>
    set((s) => {
      const next = [...s.colors] as Colors4;
      next[i] = hex;
      return { colors: next };
    }),
  toggleColor: (i) =>
    set((s) => {
      const next = [...s.active] as ActiveMask;
      const turningOff = next[i];
      const remaining = next.filter(Boolean).length;
      if (turningOff && remaining <= MIN_ACTIVE_COLORS) return {};
      next[i] = !next[i];
      return { active: next };
    }),
  setStyle: (s) => set({ style: s }),
  setBlur: (n) => set({ blur: n }),
  setGrain: (n) => set({ grain: n }),
  reshuffle: () => set({ seed: randomSeed() }),
  randomize: () =>
    set({
      colors: randomColors(),
      active: freshMask(),
      style: STYLES[Math.floor(Math.random() * STYLES.length)],
      seed: randomSeed(),
    }),
}));
