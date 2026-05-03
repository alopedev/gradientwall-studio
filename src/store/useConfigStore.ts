import { useMemo } from "react";
import { create } from "zustand";
import {
  activeColors,
  ALL_ACTIVE,
  DEFAULT_CONTRAST,
  DEFAULT_DENSITY,
  DEFAULT_LIGHT_ANGLE,
  DEFAULT_VIBRANCE,
  MIN_ACTIVE_COLORS,
  PALETTES,
  STYLES,
  type ActiveMask,
  type Colors4,
  type Device,
  type GradientConfig,
  type RenderParams,
  type Style,
} from "@/lib/palettes";
import { randomColors } from "@/lib/gradient";

/**
 * Current wallpaper configuration — the "what the studio is showing right now".
 * Ephemeral (not persisted). Direct mutations from UI sliders / device pills.
 *
 * `lightAngle` is optional on `GradientConfig` for back-compat (saved history
 * items predating lighting omit it), but the live store always carries a
 * concrete value, so we narrow it to required here.
 */
export interface ConfigState
  extends Omit<GradientConfig, "lightAngle" | "density" | "contrast" | "vibrance"> {
  device: Device;
  lightAngle: number;
  density: number;
  contrast: number;
  vibrance: number;
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
  /**
   * Apply an explicit seed (0..65535). Used by the SeedBadge editor when the
   * user pastes / types a specific seed. `reshuffle` rerolls randomly.
   */
  setSeed: (n: number) => void;
  /** Set the painterly highlight direction in compass degrees (0..360). */
  setLightAngle: (deg: number) => void;
  /** Set visual density 0..1 (clamped). 0.5 reproduces the legacy counts. */
  setDensity: (n: number) => void;
  /** Color-grading multipliers, clamped to 0.5..1.5. Identity = 1. */
  setContrast: (n: number) => void;
  setVibrance: (n: number) => void;
  reshuffle: () => void;
  randomize: () => void;
}

const randomSeed = () => Math.floor(Math.random() * 65535);
const freshMask = (): ActiveMask => [...ALL_ACTIVE] as ActiveMask;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const clampGrade = (n: number) => (n < 0.5 ? 0.5 : n > 1.5 ? 1.5 : n);

/** Numeric fields that are mutated repeatedly by slider/dial drags. */
type RafPatch = Partial<
  Pick<ConfigState, "blur" | "grain" | "lightAngle" | "density" | "contrast" | "vibrance">
>;

/**
 * rAF-coalesced setter helper. Slider/dial drags emit dozens of `onChange`
 * events per second; without batching, every event triggers a zustand update,
 * a `useRenderParams` recompute and a canvas repaint. Coalescing collapses all
 * patches that arrive within a frame into a single `set()` call so we paint
 * at most once per rAF tick. Synchronous reads via `useConfigStore.getState()`
 * remain consistent because the patch is flushed within the same animation
 * frame the browser is about to render.
 *
 * Falls back to immediate `set()` when `requestAnimationFrame` is unavailable
 * (jsdom node-env tests, SSR) so no test setup is required.
 */
function makeRafBatcher(set: (patch: RafPatch) => void) {
  let pending: RafPatch | null = null;
  let scheduled = false;
  const hasRAF = typeof requestAnimationFrame === "function";
  const flush = () => {
    scheduled = false;
    if (pending) {
      const p = pending;
      pending = null;
      set(p);
    }
  };
  return (patch: RafPatch) => {
    if (!hasRAF) {
      set(patch);
      return;
    }
    pending = pending ? { ...pending, ...patch } : { ...patch };
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  };
}

export const useConfigStore = create<ConfigState>()((set) => {
  const rafSet = makeRafBatcher(set);
  return {
  device: "desktop",
  colors: [...PALETTES[0].colors] as Colors4,
  active: freshMask(),
  style: "mesh",
  blur: 48,
  grain: 45,
  seed: randomSeed(),
  lightAngle: DEFAULT_LIGHT_ANGLE,
  density: DEFAULT_DENSITY,
  contrast: DEFAULT_CONTRAST,
  vibrance: DEFAULT_VIBRANCE,

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
  // Slider/dial setters route through the rAF batcher so a fast drag fires at
  // most one render per frame instead of one per pointermove event.
  setBlur: (n) => rafSet({ blur: n }),
  setGrain: (n) => rafSet({ grain: n }),
  setSeed: (n) => set({ seed: n & 0xffff }),
  setLightAngle: (deg) => rafSet({ lightAngle: ((deg % 360) + 360) % 360 }),
  setDensity: (n) => rafSet({ density: clamp01(n) }),
  setContrast: (n) => rafSet({ contrast: clampGrade(n) }),
  setVibrance: (n) => rafSet({ vibrance: clampGrade(n) }),
  reshuffle: () => set({ seed: randomSeed() }),
  randomize: () =>
    set({
      colors: randomColors(),
      active: freshMask(),
      style: STYLES[Math.floor(Math.random() * STYLES.length)],
      seed: randomSeed(),
      lightAngle: Math.floor(Math.random() * 360),
      density: Math.random(),
    }),
  };
});

/**
 * Pure resolver — builds a renderer-ready `RenderParams` from the config
 * snapshot. Used by `useRenderParams` (live) and by tests/coordinator code
 * that needs a one-shot extraction without subscribing.
 */
export const selectRenderParams = (s: ConfigState): RenderParams => ({
  colors: activeColors(s.colors, s.active),
  style: s.style,
  blur: s.blur,
  grain: s.grain,
  seed: s.seed,
  lightAngle: s.lightAngle,
  density: s.density,
  contrast: s.contrast,
  vibrance: s.vibrance,
});

/**
 * Subscribe to the renderer-ready params. Replaces 7 individual selectors
 * + `activeColors(colors, active)` reconstruction at every render call site.
 *
 * Implementation note: scalar selectors only — `useShallow` over the full
 * `RenderParams` doesn't work here because `activeColors` allocates a new
 * array each call (zustand sees a different reference and returns a new
 * object every render → infinite useEffect loop in consumers). The
 * `useMemo` collapses primitive deps into a stable object reference until
 * one of them actually changes.
 *
 * Stateless callers (snapshot tests, server-side render) construct a literal
 * `RenderParams` directly — the type lives in `palettes.ts`, not here.
 */
export function useRenderParams(): RenderParams {
  const colors = useConfigStore((s) => s.colors);
  const active = useConfigStore((s) => s.active);
  const style = useConfigStore((s) => s.style);
  const blur = useConfigStore((s) => s.blur);
  const grain = useConfigStore((s) => s.grain);
  const seed = useConfigStore((s) => s.seed);
  const lightAngle = useConfigStore((s) => s.lightAngle);
  const density = useConfigStore((s) => s.density);
  const contrast = useConfigStore((s) => s.contrast);
  const vibrance = useConfigStore((s) => s.vibrance);
  return useMemo(
    () => ({
      colors: activeColors(colors, active),
      style,
      blur,
      grain,
      seed,
      lightAngle,
      density,
      contrast,
      vibrance,
    }),
    [colors, active, style, blur, grain, seed, lightAngle, density, contrast, vibrance],
  );
}
