// Single source of truth for the Device / Style string unions and their runtime lists.
export const DEVICES = ["mobile", "tablet", "desktop"] as const;
export type Device = (typeof DEVICES)[number];

export const STYLES = ["mesh", "blobs", "liquid", "aurora"] as const;
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
}

export interface Palette {
  name: string;
  colors: Colors4;
  locked: boolean;
}

export const PALETTES: Palette[] = [
  { name: "Dusk", colors: ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"], locked: false },
  { name: "Tokyo", colors: ["#f72585", "#7209b7", "#3a0ca3", "#4cc9f0"], locked: false },
  { name: "Ember", colors: ["#0d0d0d", "#7a1b2e", "#ff5a36", "#ffd166"], locked: true },
  { name: "Forest", colors: ["#0b3d2e", "#1f8a70", "#bedb39", "#fff275"], locked: true },
  { name: "Nocturne", colors: ["#0a0a1a", "#1e1b4b", "#8b5cf6", "#f0abfc"], locked: true },
  { name: "Coast", colors: ["#012a4a", "#2a9df4", "#caf0f8", "#fefae0"], locked: true },
];

export interface GallerySeed {
  colors: Colors4;
  style: Style;
  seed: number;
  author: string;
  name: string;
}

export const GALLERY_SEEDS: GallerySeed[] = [
  { colors: ["#1a0b2e", "#5b2a86", "#f59e0b", "#fce5b7"], style: "mesh", seed: 12, author: "ani·k", name: "Amber dusk" },
  { colors: ["#02111b", "#2d5d7b", "#e0fbfc", "#ff9f1c"], style: "liquid", seed: 98, author: "juno", name: "Harbor 04:20" },
  { colors: ["#120021", "#450920", "#a53860", "#da627d"], style: "blobs", seed: 44, author: "m. eiji", name: "Orchid" },
  { colors: ["#050a30", "#000c66", "#7ec8e3", "#ffffff"], style: "mesh", seed: 7, author: "yuki", name: "Tideline" },
  { colors: ["#0a100d", "#34656d", "#ffd5c2", "#f56476"], style: "liquid", seed: 130, author: "c. perez", name: "Soft rebellion" },
  { colors: ["#1b1b3a", "#693668", "#a74482", "#f68e5f"], style: "blobs", seed: 77, author: "ines", name: "Nebula 12" },
  { colors: ["#0e0b16", "#a239ca", "#e7dfdd", "#4717f6"], style: "mesh", seed: 23, author: "k. tamura", name: "Ultraviolet" },
  { colors: ["#0b132b", "#1c2541", "#3a506b", "#5bc0be"], style: "liquid", seed: 55, author: "pablo", name: "Forenoon" },
];
