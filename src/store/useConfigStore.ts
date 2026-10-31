import { useMemo } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { clamp } from "@/lib/color";
import { useShallow } from "zustand/react/shallow";
import {
  ALL_ACTIVE,
  MIN_ACTIVE_COLORS,
  PALETTES,
  type ActiveMask,
  type Colors4,
  type Device,
  type Material,
  type RenderParams,
  type Style,
} from "@/lib/palettes";
import {
  DEFAULT_CONTRAST,
  DEFAULT_DENSITY,
  DEFAULT_MATERIAL,
  STUDIO_BLUR,
  STUDIO_VIBRANCE,
  V2_DEFAULT_GRAIN,
  V2_DEFAULT_LIGHT_ANGLE,
} from "@/lib/defaults";
import { type Look, pickLook, toFavoriteConfig, toRenderParams } from "@/lib/look";
import { generateRemix } from "@/lib/gradient/remix";
import { generateSurprise } from "@/lib/gradient/surprise";
import { makeRafBatcher } from "@/lib/raf-batcher";

/**
 * Current wallpaper configuration — the "what the studio is showing right now".
 * Ephemeral (not persisted). Direct mutations from UI sliders / device pills.
 *
 * The wallpaper fields are a `Look` (see `lib/look.ts`): the live store always
 * carries a concrete value for each, and translating to render params or to a
 * favorite goes through that module.
 *
 * - `engine`: renders the current wallpaper. New wallpapers (start, shuffle,
 *   remix) are v2; loading a favorite saved with v1 switches back to v1 so it
 *   looks the way it was saved.
 * - `active`: per-slot on/off over the four colors. A `false` entry removes
 *   that slot from the rendered ramp so the wallpaper uses 2 or 3 colors
 *   instead of 4. Replacing the palette (setColors, applyPalette,
 *   gallery load) snaps the mask back to all-true.
 */
export interface ConfigState extends Look {
  device: Device;
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
  /** Material over the wallpaper. Like the style, it is the user's: shuffle and remix keep it. */
  setMaterial: (m: Material) => void;
  setBlur: (n: number) => void;
  setGrain: (n: number) => void;
  /** Set the painterly highlight direction in compass degrees (0..360). */
  setLightAngle: (deg: number) => void;
  /** Color-grading multipliers, clamped to 0.5..1.5. Identity = 1. */
  setContrast: (n: number) => void;
  setVibrance: (n: number) => void;
  /**
   * Studio v2 — surprise-first. Aplica un `GradientConfig` generado por
   * `generateSurprise` (paleta armónica + style weighted + curated seed +
   * defaults curados). Garantiza que `seed` sea distinto al actual. Tras la
   * llamada el canvas se repinta con un wallpaper distinto al anterior.
   */
  applySurprise: () => void;
  /**
   * Studio v2 — remix. Variación cercana del wallpaper actual: mantiene
   * paleta y style, varía seed + lightAngle + density + blur dentro de
   * rangos cortos. Pensado para el botón "Remix" cuando el usuario quiere
   * ver otra cara de la misma idea.
   */
  applyRemix: () => void;
}

const randomSeed = () => Math.floor(Math.random() * 65535);
const freshMask = (): ActiveMask => [...ALL_ACTIVE] as ActiveMask;

const clampGrade = (n: number) => clamp(n, 0.5, 1.5);

/** Numeric fields that are mutated repeatedly by slider/dial drags. */
type RafPatch = Partial<
  Pick<ConfigState, "blur" | "grain" | "lightAngle" | "density" | "contrast" | "vibrance">
>;

const configStore = createStore<ConfigState>()((set) => {
  const rafSet = makeRafBatcher<RafPatch>(set);
  return {
    device: "mobile",
    engine: "v2",
    colors: [...PALETTES[0].colors] as Colors4,
    active: freshMask(),
    style: "mesh",
    // Starting look (lib/defaults.ts). Grain / contrast / vibrance are the user's
    // to set in the Adjust panel, so surprise and remix leave them alone.
    blur: STUDIO_BLUR,
    grain: V2_DEFAULT_GRAIN,
    seed: randomSeed(),
    lightAngle: V2_DEFAULT_LIGHT_ANGLE,
    density: DEFAULT_DENSITY,
    contrast: DEFAULT_CONTRAST,
    vibrance: STUDIO_VIBRANCE,
    material: DEFAULT_MATERIAL,

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
    setMaterial: (m) => set({ material: m }),
    // Slider/dial setters route through the rAF batcher so a fast drag fires at
    // most one render per frame instead of one per pointermove event.
    setBlur: (n) => rafSet({ blur: n }),
    setGrain: (n) => rafSet({ grain: n }),
    setLightAngle: (deg) => rafSet({ lightAngle: ((deg % 360) + 360) % 360 }),
    setContrast: (n) => rafSet({ contrast: clampGrade(n) }),
    setVibrance: (n) => rafSet({ vibrance: clampGrade(n) }),
    applySurprise: () =>
      set((s) => {
        const next = generateSurprise(s.seed);
        return {
          engine: "v2",
          colors: next.colors,
          active: freshMask(),
          // The style is the user's choice (segmented control), not part of the surprise.
          style: s.style,
          blur: next.blur,
          seed: next.seed,
          lightAngle: next.lightAngle ?? s.lightAngle,
          density: next.density ?? s.density,
        };
      }),
    applyRemix: () =>
      set((s) => {
        const current = toFavoriteConfig(s);
        const next = generateRemix(current);
        return {
          engine: "v2",
          colors: next.colors,
          // active no se toca — el remix mantiene la misma paleta
          style: next.style,
          blur: next.blur,
          grain: next.grain ?? s.grain,
          seed: next.seed,
          lightAngle: next.lightAngle ?? s.lightAngle,
          density: next.density ?? s.density,
          contrast: next.contrast ?? s.contrast,
          vibrance: next.vibrance ?? s.vibrance,
        };
      }),
  };
});

// Server rendering and hydration read the store's current state, not the one
// it was created with (zustand's default): the prerender and `main.tsx` put
// each page on its starting look (`store/page-start.ts`) before rendering, so
// both draw the same wallpaper.
Object.assign(configStore, { getServerState: configStore.getState });

/** The config store as a hook, `useConfigStore(selector)`, plus its API (`getState`, `setState`…). */
export const useConfigStore = Object.assign(
  <T = ConfigState>(selector?: (state: ConfigState) => T): T =>
    useStore(configStore, selector ?? ((s) => s as T)),
  configStore,
);

/**
 * Pure resolver — builds a renderer-ready `RenderParams` from the config
 * snapshot. Used by tests/coordinator code that needs a one-shot extraction
 * without subscribing.
 */
export const selectRenderParams = (s: ConfigState): RenderParams => toRenderParams(s);

/**
 * Subscribe to the current look (every field that draws the wallpaper).
 * `useShallow` keeps the object reference stable until one field changes.
 */
export function useLook(): Look {
  return useConfigStore(useShallow(pickLook));
}

/**
 * Subscribe to the renderer-ready params. Memoized on the look so consumers
 * that put it in an effect dependency list don't loop: `toRenderParams`
 * allocates a new color ramp on every call.
 *
 * Stateless callers (snapshot tests, server-side render) construct a literal
 * `RenderParams` directly — the type lives in `palettes.ts`, not here.
 */
export function useRenderParams(): RenderParams {
  const look = useLook();
  return useMemo(() => toRenderParams(look), [look]);
}
