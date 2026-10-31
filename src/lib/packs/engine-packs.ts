/**
 * Packs drawn by the Studio's own v2 engine instead of generated art. Each
 * piece is a look, so the files are rendered at every Etsy size natively (no
 * upscaling) by `scripts/render-engine-pack.mjs`, which writes the same
 * `etsy-out/<slug>/` layout as `etsy-pack.sh` so the listing renderer works
 * unchanged. Pure: relative imports only, so the Node script can use it.
 */

import type { SharedLook } from "../look-url";

export interface EnginePackPiece extends SharedLook {
  /** Colour words for the file and the listing ("terracotta"). */
  name: string;
}

export interface EnginePack {
  slug: string;
  name: string;
  /** Colours dark → light, the ramp order the shader expects. */
  pieces: EnginePackPiece[];
}

export const ENGINE_PACK_SIZES = {
  mobile: { w: 1320, h: 2868 },
  "4k": { w: 3840, h: 2160 },
  "5k": { w: 5120, h: 2880 },
} as const;

export type EnginePackFormat = keyof typeof ENGINE_PACK_SIZES;

const liquid = (
  name: string,
  seed: number,
  colors: SharedLook["colors"],
  lightAngle: number,
): EnginePackPiece => ({ name, style: "liquid", seed, colors, lightAngle, grain: 40 });

/** Chosen by Àlex on 2026-10-31 (direction D of the six). */
const MARBLE: EnginePack = {
  slug: "marble",
  name: "Marble",
  pieces: [
    liquid("terracotta", 20612, ["#2b1a12", "#8a4b2c", "#d9a07a", "#f4e9dc"], 300),
    liquid("olive", 11603, ["#1c2418", "#4f5d3a", "#a6ad7c", "#f1eedd"], 140),
    liquid("slate blue", 14060, ["#14202c", "#3d5a73", "#9cb3c4", "#eef1ef"], 220),
    liquid("rose clay", 2594, ["#2a1014", "#7a2e35", "#c98a7d", "#f6e7dc"], 40),
    liquid("graphite", 35354, ["#1a1a1a", "#4a4744", "#a39e96", "#f2efe9"], 320),
    liquid("ochre", 18974, ["#2b2010", "#8a6a2a", "#d8b974", "#f8f0dc"], 200),
    liquid("jade", 40268, ["#0f2422", "#2c5a52", "#8fb8a8", "#eef5ee"], 100),
    liquid("lavender", 53372, ["#251630", "#5f4475", "#b6a2c8", "#f3eef5"], 260),
    liquid("apricot", 64019, ["#3a1a0a", "#b0532a", "#e8a96c", "#fbf0de"], 10),
    liquid("navy and gold", 9146, ["#101828", "#2a3d6b", "#c7a46a", "#f4ecdc"], 170),
    liquid("walnut", 27731, ["#241812", "#5e4636", "#b49a84", "#efe6dc"], 290),
    liquid("sienna", 48211, ["#1a2414", "#c0603a", "#e9c49a", "#f7efe2"], 60),
  ],
};

export const ENGINE_PACKS: Record<string, EnginePack> = { marble: MARBLE };

export function getEnginePack(slug: string): EnginePack | undefined {
  return ENGINE_PACKS[slug];
}

/** `<fmt>/gradientwall-<slug>-NN-<fmt>.jpg`, as `etsy-pack.sh` names them. */
export function enginePackFile(slug: string, index: number, format: EnginePackFormat): string {
  const n = String(index + 1).padStart(2, "0");
  return `${format}/gradientwall-${slug}-${n}-${format}.jpg`;
}
