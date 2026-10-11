import { hexToHsl } from "./color";
import { type Colors4, PALETTES } from "./palettes";

/** [upper bound of the hue range in degrees, name]. First match wins. */
const HUE_NAMES: readonly (readonly [number, string])[] = [
  [20, "Ember"],
  [45, "Amber"],
  [70, "Honey"],
  [150, "Moss"],
  [185, "Lagoon"],
  [215, "Glacier"],
  [250, "Cobalt"],
  [285, "Iris"],
  [330, "Orchid"],
  [360, "Rose"],
];

/**
 * Display name for a palette: the curated name when the colors match one,
 * otherwise a name taken from the hue of the most vivid color. Stable for the
 * same input, so the label doesn't flicker between renders.
 */
export function paletteName(colors: readonly string[]): string {
  const key = colors.join(",").toLowerCase();
  const curated = PALETTES.find((p) => p.colors.join(",").toLowerCase() === key);
  if (curated) return curated.name;

  let best = { h: 0, s: 0, l: 0, score: -1 };
  for (const c of colors) {
    const [h, sPct, lPct] = hexToHsl(c);
    const hsl = { h, s: sPct / 100, l: lPct / 100 };
    // Favor saturated colors that aren't near-black or near-white.
    const score = hsl.s * (1 - Math.abs(hsl.l - 0.5) * 1.6);
    if (score > best.score) best = { ...hsl, score };
  }
  if (best.s < 0.12) return "Graphite";
  return HUE_NAMES.find(([max]) => best.h < max)?.[1] ?? "Rose";
}

/** Index of the curated palette matching `colors`, or -1. */
export function curatedPaletteIndex(colors: Colors4): number {
  const key = colors.join(",").toLowerCase();
  return PALETTES.findIndex((p) => p.colors.join(",").toLowerCase() === key);
}
