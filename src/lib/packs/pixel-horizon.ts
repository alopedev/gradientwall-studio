/**
 * Horizon: a pack of pixel-art scenes (a sun or a moon over the sea or behind
 * dunes), drawn on a coarse grid of cells and ordered-dithered onto a 5-colour
 * ramp. Chosen by Àlex on 2026-10-31 (direction D of the six in
 * `/mnt/project-files/features/pack-pixel/`). Not something the Studio draws:
 * the Studio dithers a gradient, this composes a scene.
 *
 * Pure and deterministic: a piece and a grid size always give the same cells,
 * so every Etsy size is rendered natively (no upscaling). The grid keeps the
 * same number of cells across the short side at every size, so phone, 4K and
 * 5K show the same pixel art. Relative imports only (the Node render script
 * loads it through the dev server).
 */

export type HorizonScene = "sea" | "dunes" | "moon";

/** Five colours, darkest (the black of an OLED screen) to lightest. */
export type HorizonRamp = readonly [string, string, string, string, string];

export interface HorizonPiece {
  /** Colour and scene words for the file and the listing ("orchid sunset"). */
  name: string;
  scene: HorizonScene;
  ramp: HorizonRamp;
  /** Height of the horizon line, 0 = top, 1 = bottom. */
  horizon: number;
  /** Centre of the sun or moon: x across the width, y down the height (0..1). */
  sun: { x: number; y: number };
  /** Radius of the sun or moon as a share of the short side. */
  radius: number;
  /** Varies the dunes and the stars. */
  seed: number;
}

/** Cells across the short side, at every size. */
export const HORIZON_CELLS = 72;

/** Cell edge in pixels for a canvas of `w`×`h` (at least 1). */
export function horizonCellSize(w: number, h: number): number {
  return Math.max(1, Math.round(Math.min(w, h) / HORIZON_CELLS));
}

const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];
const bayer = (x: number, y: number) => (BAYER8[(y & 7) * 8 + (x & 7)] + 0.5) / 64;

/** Ordered dither of a brightness 0..1 onto the ramp: an index 0..4. */
export function ditherIndex(t: number, x: number, y: number): number {
  const p = (Number.isFinite(t) ? Math.min(0.9999, Math.max(0, t)) : 0) * 4;
  const i = Math.floor(p);
  return p - i > bayer(x, y) ? i + 1 : i;
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A dune crest: smooth rolling heights per column, in rows (never below `base`). */
function dune(
  cols: number,
  short: number,
  rng: () => number,
  base: number,
  amp: number,
  wave: number,
) {
  const p1 = rng() * 6.283;
  const p2 = rng() * 6.283;
  const out = new Float64Array(cols);
  for (let x = 0; x < cols; x++) {
    const u = (x + 0.5) / short;
    // 1 − |sin|: sharp crests and soft hollows, the shape of wind-blown sand.
    const h = 0.75 * (1 - Math.abs(Math.sin(u * wave + p1))) + 0.25 * Math.sin(u * wave * 1.7 + p2);
    out[x] = base - amp * h;
  }
  return out;
}

/**
 * The scene as ramp indices, one per cell, row by row (`cols * rows`).
 * Brightness is decided per cell and then dithered, so the art stays crisp.
 */
export function horizonCells(piece: HorizonPiece, cols: number, rows: number): Uint8Array {
  const out = new Uint8Array(cols * rows);
  const short = Math.min(cols, rows);
  const hz = Math.round(piece.horizon * rows);
  const cx = piece.sun.x * cols;
  const cy = piece.sun.y * rows;
  // Landscape screens get a smaller disc, so it doesn't fill the height.
  const r = piece.radius * short * (cols > rows ? 0.7 : 1);
  const night = piece.scene === "moon";
  const rng = mulberry(piece.seed);

  // Three rows of dunes, back to front: lower and wider towards the viewer.
  const dunes =
    piece.scene === "dunes"
      ? [0, 1, 2].map((k) =>
          dune(
            cols,
            short,
            rng,
            hz + short * [0.12, 0.45, 0.85][k],
            short * [0.12, 0.2, 0.3][k],
            [3, 2.2, 1.5][k],
          ),
        )
      : [];
  const waterTop = hz;
  const stars = new Set<number>();
  if (night) {
    const n = Math.round(cols * rows * 0.006);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(rng() * cols);
      const y = Math.floor(rng() * hz * 0.85);
      stars.add(y * cols + x);
    }
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      out[y * cols + x] = cellIndex(x, y);
    }
  }
  return out;

  function cellIndex(x: number, y: number): number {
    const px = x + 0.5;
    const py = y + 0.5;
    const dx = (px - cx) / r;
    const dy = (py - cy) / r;
    const d = Math.hypot(dx, dy);

    for (let k = dunes.length - 1; k >= 0; k--) {
      const crest = dunes[k];
      if (py <= crest[x]) continue;
      // Sun-facing slopes catch light, the far side falls into shade; a lit rim on the crest.
      const slope = (crest[Math.min(cols - 1, x + 1)] - crest[Math.max(0, x - 1)]) / 2;
      const toward = Math.max(-1, Math.min(1, (cx - px) / (short * 0.35)));
      // Fades with depth, so a crest's light/shade split doesn't run down as a straight seam.
      const fade = Math.max(0, 1 - (py - crest[x]) / (short * 0.1));
      const facing = Math.max(-1, Math.min(1, slope * 1.5)) * toward * fade;
      const rim = Math.max(0, 1 - (py - crest[x]) / 2) * 0.3;
      const body = Math.max(0, 1 - (py - crest[x]) / (short * 0.2)) * 0.1;
      return ditherIndex(0.3 - k * 0.08 - facing * 0.14 + rim + body, x, y);
    }

    if (y < hz || dunes.length > 0) {
      if (night) {
        if (stars.has(y * cols + x)) return (x * 7 + y * 13) % 10 < 3 ? 4 : 3;
        // A crescent: the moon disc minus a disc offset towards the upper left.
        const bite = Math.hypot(dx + 0.42, dy + 0.18);
        if (d < 1 && bite >= 0.92) return ditherIndex(0.9 - dy * 0.08, x, y);
        const glow = Math.exp(-Math.max(0, d - 1) * 1.6) * 0.2;
        return ditherIndex((py / hz) * 0.32 + glow, x, y);
      }
      if (d < 1) {
        // Over the sea, horizontal cuts across the lower half, wider towards the
        // bottom; over the dunes, a plain high sun so the two scenes don't rhyme.
        if (dy > 0 && dunes.length === 0) {
          const bands = dy * 6;
          if (bands - Math.floor(bands) < 0.15 + dy * 0.6)
            return ditherIndex((py / hz) * 0.5, x, y);
        }
        return ditherIndex(0.82 + (1 - (dy + 1) / 2) * 0.18, x, y);
      }
      const glow = Math.exp(-Math.max(0, d - 1) * 1.4) * 0.35;
      return ditherIndex((py / hz) * 0.5 + glow, x, y);
    }

    if (y < waterTop) return 0;
    // Sea: dark, with a shimmering reflection under the sun or moon.
    const depth = (py - waterTop) / Math.max(1, rows - waterTop);
    const w = Math.abs(px - cx) / (r * (1 - depth * 0.3));
    const shimmer = Math.sin(y * 1.7) * 0.5 + 0.5;
    const strength = night ? 0.45 : 0.85;
    const refl = w < 1 ? (1 - w) * (1 - depth) * strength * (0.4 + 0.6 * shimmer) : 0;
    return ditherIndex(0.08 + refl, x, y);
  }
}

/** Grid size for a canvas: whole cells, the last row/column cropped. */
export function horizonGrid(w: number, h: number) {
  const cell = horizonCellSize(w, h);
  return { cell, cols: Math.ceil(w / cell), rows: Math.ceil(h / cell) };
}

const ORCHID: HorizonRamp = ["#000000", "#3a0d38", "#9a2e86", "#e07ccc", "#fbe1f3"];
const PLUM: HorizonRamp = ["#000000", "#2e1236", "#7f3a6e", "#e9867c", "#ffe0c2"];
const AMBER: HorizonRamp = ["#000000", "#40120a", "#b2401f", "#f59a45", "#ffe6b0"];
const CORAL: HorizonRamp = ["#000000", "#3d0c1a", "#a8324a", "#f0806a", "#ffd8c4"];

const sea = (
  name: string,
  ramp: HorizonRamp,
  x: number,
  y: number,
  radius: number,
): HorizonPiece => ({ name, scene: "sea", ramp, horizon: 0.585, sun: { x, y }, radius, seed: 1 });
const dunes = (name: string, ramp: HorizonRamp, x: number, seed: number): HorizonPiece => ({
  name,
  scene: "dunes",
  ramp,
  horizon: 0.5,
  sun: { x, y: 0.27 },
  radius: 0.14,
  seed,
});
const moon = (
  name: string,
  ramp: HorizonRamp,
  x: number,
  y: number,
  seed: number,
): HorizonPiece => ({
  name,
  scene: "moon",
  ramp,
  horizon: 0.66,
  sun: { x, y },
  radius: 0.16,
  seed,
});

/** The 12 pieces: three scenes in each of four warm palettes. */
export const HORIZON_PIECES: readonly HorizonPiece[] = [
  sea("orchid sunset", ORCHID, 0.5, 0.5, 0.27),
  dunes("orchid dunes", ORCHID, 0.5, 7),
  moon("orchid moonrise", ORCHID, 0.66, 0.3, 11),
  sea("plum sunset", PLUM, 0.5, 0.53, 0.3),
  dunes("plum dunes", PLUM, 0.42, 23),
  moon("plum moonrise", PLUM, 0.34, 0.26, 5),
  sea("amber sunset", AMBER, 0.5, 0.48, 0.24),
  dunes("amber dunes", AMBER, 0.58, 41),
  moon("amber moonrise", AMBER, 0.62, 0.34, 17),
  sea("coral sunset", CORAL, 0.5, 0.55, 0.32),
  dunes("coral dunes", CORAL, 0.5, 3),
  moon("coral moonrise", CORAL, 0.4, 0.28, 29),
];
