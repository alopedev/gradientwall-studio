import { buildGradientSpec, paintSpecToCanvas } from "./gradient";
import type { Colors4, Style } from "./palettes";

interface PoolSpec {
  colors: Colors4;
  style: Style;
  blur: number;
  seed: number;
}

const POOL_SPECS: PoolSpec[] = [
  { colors: ["#1a0b2e", "#5b2a86", "#f59e0b", "#fce5b7"], style: "mesh", blur: 55, seed: 12 },
  { colors: ["#02111b", "#2d5d7b", "#e0fbfc", "#ff9f1c"], style: "liquid", blur: 55, seed: 98 },
  { colors: ["#120021", "#450920", "#a53860", "#da627d"], style: "aurora", blur: 55, seed: 44 },
  { colors: ["#050a30", "#000c66", "#7ec8e3", "#ffffff"], style: "mesh", blur: 55, seed: 7 },
  { colors: ["#0a100d", "#34656d", "#ffd5c2", "#f56476"], style: "liquid", blur: 55, seed: 130 },
  { colors: ["#1b1b3a", "#693668", "#a74482", "#f68e5f"], style: "aurora", blur: 55, seed: 77 },
  { colors: ["#0e0b16", "#a239ca", "#e7dfdd", "#4717f6"], style: "mesh", blur: 55, seed: 23 },
  { colors: ["#0b132b", "#1c2541", "#3a506b", "#5bc0be"], style: "liquid", blur: 55, seed: 55 },
  { colors: ["#111111", "#ff3366", "#ffcc00", "#f2f2f2"], style: "aurora", blur: 55, seed: 201 },
  { colors: ["#0d0d0d", "#1e40af", "#06b6d4", "#e0f2fe"], style: "mesh", blur: 55, seed: 309 },
];

const PX = 240;

// Devuelve data URLs, no canvases: cloneNode sobre un canvas no copia el
// bitmap pintado, así que un pool de <img> con src ya decodificado hace el
// spawn de sprites barato y fiable.
export function buildMiniaturePool(): string[] {
  if (typeof document === "undefined") return [];
  return POOL_SPECS.map((spec) => {
    const canvas = document.createElement("canvas");
    canvas.width = PX;
    canvas.height = PX;
    paintSpecToCanvas(
      canvas,
      buildGradientSpec({
        w: PX,
        h: PX,
        colors: spec.colors,
        style: spec.style,
        blur: spec.blur,
        seed: spec.seed,
      }),
    );
    return canvas.toDataURL("image/webp", 0.85);
  });
}

export const MINIATURE_POOL_SIZE = POOL_SPECS.length;
