// Single source of truth for the Device / Style string unions and their runtime lists.
export const DEVICES = ["mobile", "tablet", "desktop"] as const;
export type Device = (typeof DEVICES)[number];

export const STYLES = ["mesh", "blobs", "liquid", "aurora", "nebula"] as const;
export type Style = (typeof STYLES)[number];

export type Colors4 = [string, string, string, string];

/**
 * Per-slot on/off mask over the four colors. A slot set to `false` is
 * excluded from the rendered gradient so the wallpaper renders with 2 or 3
 * colors instead of all 4. The UI never exposes fewer slots than 4 — this
 * is purely about which of the 4 feed the renderer.
 */
export type ActiveMask = [boolean, boolean, boolean, boolean];

/** Default mask: every slot contributes. */
export const ALL_ACTIVE: ActiveMask = [true, true, true, true];

/**
 * Minimum active slots. Fewer than two colors yields a solid fill or near-
 * solid ramp — not a "gradient" in any useful sense.
 */
export const MIN_ACTIVE_COLORS = 2;

/**
 * Filter a `Colors4` tuple to the subset flagged active in the mask. Used
 * at render call-sites to build the variable-length ramp fed to the spec.
 * Defaults to `ALL_ACTIVE` so legacy callers (gallery seeds, un-masked
 * history items) keep behaving as they did before.
 */
export function activeColors(colors: Colors4, active: ActiveMask = ALL_ACTIVE): readonly string[] {
  return colors.filter((_, i) => active[i]);
}

export interface DeviceSize {
  w: number;
  h: number;
  label: string;
}

// Studio 5K — premium quality tier, 2026 flagship targets.
// Mobile covers iPhone 16 Pro Max + Samsung S25 Ultra with parallax headroom.
// Tablet is iPad Pro 13" M4 native. Desktop is Apple Studio Display 5K native —
// downscales cleanly to 4K, covers MacBook Pro 14"/16" with parallax overhead.
export const DEVICE_SIZES: Record<Device, DeviceSize> = {
  mobile: { w: 1440, h: 3200, label: "1440 × 3200" },
  tablet: { w: 2064, h: 2752, label: "2064 × 2752" },
  desktop: { w: 5120, h: 2880, label: "5120 × 2880" },
};

// Shared shape describing a wallpaper's rendering parameters.
// `RenderOpts` (gradient.ts) adds raster dimensions; `HistoryItem` (store) persists it;
// `DownloadOpts` (download.ts) adds the device target.
export interface GradientConfig {
  colors: Colors4;
  style: Style;
  blur: number;
  grain: number;
  seed: number;
  /**
   * Direction of the painterly highlight layer, in compass degrees:
   * `0` = top, `90` = right, `180` = bottom, `270` = left. Surfaced through
   * the LightDial knob inside the Studio Effects section. The renderer
   * appends a soft white radial offset toward this direction on top of the
   * style's own layers, so two gradients with the same colors / seed look
   * compositionally different at different light angles.
   *
   * Optional: pre-light history items + tests omit it; the renderer treats
   * `undefined` as "skip the highlight pass" — back-compat with snapshots
   * frozen before lighting existed.
   */
  lightAngle?: number;
  /**
   * Visual density of the style, normalized 0..1. Default 0.5 reproduces the
   * historical hard-coded layer counts (mesh 4 / blobs 14 / liquid 6 / aurora
   * 2 bands per color), so old snapshots and pre-density history items keep
   * rendering byte-identical. The renderer maps it conservatively per style;
   * see `buildGradientSpec`.
   *
   * For the WebGL Nebula style this drives shader uniforms (cloud thickness)
   * rather than a layer count.
   */
  density?: number;
}

/** Default light angle: top-right painterly convention. */
export const DEFAULT_LIGHT_ANGLE = 135;

/**
 * Variable-length color ramp — `Colors4` after the user's per-slot active
 * mask is applied. The studio config keeps 4 slots; the renderer sees the
 * filtered subset (2..4 entries). `ColorRamp` re-exported from here so all
 * render-input types are owned by `palettes.ts` (canonical source of truth).
 */
export type ColorRamp = readonly string[];

/**
 * Single canonical shape for "what gets rendered". One field per render
 * parameter. Adding a new knob (e.g. `density`, `saturation`, `vignette`)
 * is one edit here, one edit in `spec.ts` to consume it, one edit in the
 * store to default + expose it. Three files instead of nine.
 *
 * `lightAngle` and `grain` are optional so legacy fixtures (snapshot tests,
 * pre-lighting history items) still type-check; the live store always sets
 * a concrete value via `selectRenderParams`.
 */
export interface RenderParams {
  /** Post-mask color ramp (2..4 entries). */
  colors: ColorRamp;
  style: Style;
  blur: number;
  grain?: number;
  seed: number;
  lightAngle?: number;
  /**
   * Visual density 0..1. `undefined` is treated as 0.5 by the renderer,
   * which reproduces the historical layer counts (so legacy fixtures and
   * pre-density history items render unchanged).
   */
  density?: number;
}

/** Default density: midpoint reproduces the pre-density layer counts. */
export const DEFAULT_DENSITY = 0.5;

export interface Palette {
  name: string;
  colors: Colors4;
  locked: boolean;
}

export const PALETTES: Palette[] = [
  { name: "Dusk", colors: ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"], locked: false },
  { name: "Tokyo", colors: ["#f72585", "#7209b7", "#3a0ca3", "#4cc9f0"], locked: false },
  { name: "Ember", colors: ["#0d0d0d", "#7a1b2e", "#ff5a36", "#ffd166"], locked: false },
  { name: "Forest", colors: ["#0b3d2e", "#1f8a70", "#bedb39", "#fff275"], locked: false },
  { name: "Nocturne", colors: ["#0a0a1a", "#1e1b4b", "#8b5cf6", "#f0abfc"], locked: false },
  { name: "Coast", colors: ["#012a4a", "#2a9df4", "#caf0f8", "#fefae0"], locked: false },
];

