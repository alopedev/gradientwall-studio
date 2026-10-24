/**
 * The gallery on each landing: 12 wallpapers drawn by the Studio's v2 engine,
 * shipped as real image files so Google Images and Pinterest can find them
 * (the Studio itself paints on a canvas, which nothing indexes). Each piece is
 * a look, so it can be rendered again and opened in the Studio.
 *
 * The files are made by `scripts/render-gallery.mjs` from this list and
 * committed; the build doesn't render them. Pure: relative imports only, so
 * `pages.ts` (sitemap, JSON-LD) can use it in Node.
 */

import { lookHref, type SharedLook } from "../look-url";
import { type Landing, landingPath } from "./landings";

export interface GalleryPiece extends SharedLook {
  /** What it looks like, in plain colour words ("icy blue"); starts its alt text and file name. */
  name: string;
}

export interface Gallery {
  /** Visible heading, lowercase like the site's. */
  heading: string;
  /** What the files are for, in the alt text: "iPhone", "phone", "4K desktop". */
  subject: string;
  /** A word the landing is about that the style name doesn't say ("grainy"). */
  adjective?: string;
  pieces: GalleryPiece[];
}

export type GalleryShape = "phone" | "desktop";

/** Master JPEG size and the WebP widths beside it, per shape. */
export const GALLERY_FILES: Record<GalleryShape, { w: number; h: number; widths: number[] }> = {
  phone: { w: 720, h: 1600, widths: [360, 720] },
  desktop: { w: 1600, h: 900, widths: [640, 1280] },
};

export const GALLERY_DIR = "/assets/gallery";

export interface GalleryImage {
  piece: GalleryPiece;
  alt: string;
  /** Master JPEG: the `src`, the sitemap and JSON-LD entry. */
  src: string;
  srcSet: string;
  width: number;
  height: number;
  /** The landing with this look in `?w=`, landing on the Studio. */
  studioHref: string;
}

export const GALLERIES: Record<string, Gallery> = {
  "iphone-gradient-wallpapers": {
    heading: "12 iphone gradient wallpapers to download.",
    subject: "iPhone",
    pieces: [
      {
        name: "olive and lemon",
        style: "mesh",
        seed: 20612,
        colors: ["#0b3d2e", "#1f8a70", "#bedb39", "#fff275"],
        lightAngle: 122,
        grain: 45,
      },
      {
        name: "amber",
        style: "liquid",
        seed: 11603,
        colors: ["#a93b2f", "#e17e36", "#f1d859", "#e0e580"],
        lightAngle: 323,
        grain: 45,
      },
      {
        name: "deep indigo",
        style: "mesh",
        seed: 14060,
        colors: ["#0a0a1a", "#1e1b4b", "#8b5cf6", "#f0abfc"],
        lightAngle: 201,
        grain: 45,
      },
      {
        name: "peach and rust",
        style: "liquid",
        seed: 26345,
        colors: ["#be232e", "#de633d", "#f3b66a", "#eee89e"],
        lightAngle: 296,
        grain: 45,
      },
      {
        name: "icy blue",
        style: "mesh",
        seed: 1775,
        colors: ["#012a4a", "#2a9df4", "#caf0f8", "#fefae0"],
        lightAngle: 104,
        grain: 45,
      },
      {
        name: "pink and aqua",
        style: "liquid",
        seed: 52553,
        colors: ["#b7ce40", "#54d1e9", "#f86ae1", "#8cefbd"],
        lightAngle: 282,
        grain: 45,
      },
      {
        name: "burnt orange",
        style: "aurora",
        seed: 64019,
        colors: ["#b62522", "#f39b3e", "#60f8ae", "#66a4e7"],
        lightAngle: 203,
        grain: 45,
      },
      {
        name: "charcoal grey",
        style: "mesh",
        seed: 47639,
        colors: ["#0f172a", "#475569", "#cbd5e1", "#f8fafc"],
        lightAngle: 263,
        grain: 45,
      },
      {
        name: "neon pastel",
        style: "liquid",
        seed: 39449,
        colors: ["#2cb8dd", "#e734c1", "#cbe470", "#c180eb"],
        lightAngle: 316,
        grain: 45,
      },
      {
        name: "blue and coral",
        style: "aurora",
        seed: 9146,
        colors: ["#344ab4", "#f43455", "#6aed4e", "#e378e4"],
        lightAngle: 267,
        grain: 45,
      },
      {
        name: "burgundy and pink",
        style: "mesh",
        seed: 36992,
        colors: ["#2b0a0a", "#9f1239", "#f43f5e", "#fecdd3"],
        lightAngle: 248,
        grain: 45,
      },
      {
        name: "violet and hot pink",
        style: "mesh",
        seed: 30440,
        colors: ["#f72585", "#7209b7", "#3a0ca3", "#4cc9f0"],
        lightAngle: 279,
        grain: 45,
      },
    ],
  },
  "4k-gradient-wallpapers": {
    heading: "12 4k gradient wallpapers to download.",
    subject: "4K desktop",
    pieces: [
      {
        name: "burgundy",
        style: "mesh",
        seed: 50915,
        colors: ["#2b0a0a", "#9f1239", "#f43f5e", "#fecdd3"],
        lightAngle: 260,
        grain: 45,
      },
      {
        name: "neon green and coral",
        style: "liquid",
        seed: 6689,
        colors: ["#c034c1", "#e73566", "#5cf85b", "#81e5ca"],
        lightAngle: 180,
        grain: 45,
      },
      {
        name: "peach and plum",
        style: "mesh",
        seed: 63200,
        colors: ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"],
        lightAngle: 120,
        grain: 45,
      },
      {
        name: "royal blue and gold",
        style: "aurora",
        seed: 11603,
        colors: ["#3e2add", "#a94fe2", "#f0bf71", "#95e95f"],
        lightAngle: 288,
        grain: 45,
      },
      {
        name: "violet and pink",
        style: "mesh",
        seed: 30440,
        colors: ["#f72585", "#7209b7", "#3a0ca3", "#4cc9f0"],
        lightAngle: 221,
        grain: 45,
      },
      {
        name: "copper brown",
        style: "mesh",
        seed: 15698,
        colors: ["#0d0d0d", "#7a1b2e", "#ff5a36", "#ffd166"],
        lightAngle: 249,
        grain: 45,
      },
      {
        name: "orange and indigo",
        style: "liquid",
        seed: 6689,
        colors: ["#3560c0", "#502ceb", "#f17b60", "#daed86"],
        lightAngle: 322,
        grain: 45,
      },
      {
        name: "forest green and lemon",
        style: "mesh",
        seed: 32078,
        colors: ["#0b3d2e", "#1f8a70", "#bedb39", "#fff275"],
        lightAngle: 137,
        grain: 45,
      },
      {
        name: "steel blue",
        style: "mesh",
        seed: 13241,
        colors: ["#012a4a", "#2a9df4", "#caf0f8", "#fefae0"],
        lightAngle: 312,
        grain: 45,
      },
      {
        name: "sand beige",
        style: "mesh",
        seed: 5870,
        colors: ["#3a2618", "#7c5a3f", "#c9a982", "#f4e8d8"],
        lightAngle: 319,
        grain: 45,
      },
      {
        name: "aqua and lime",
        style: "liquid",
        seed: 57467,
        colors: ["#c57d34", "#c6f140", "#50a3f7", "#896fdc"],
        lightAngle: 129,
        grain: 45,
      },
      {
        name: "silver grey",
        style: "mesh",
        seed: 49277,
        colors: ["#0f172a", "#475569", "#cbd5e1", "#f8fafc"],
        lightAngle: 100,
        grain: 45,
      },
    ],
  },
  "mesh-gradient-wallpapers": {
    heading: "12 mesh gradient wallpapers to download.",
    subject: "phone",
    pieces: [
      {
        name: "crimson",
        style: "mesh",
        seed: 41087,
        colors: ["#2b0a0a", "#9f1239", "#f43f5e", "#fecdd3"],
        lightAngle: 290,
        grain: 45,
      },
      {
        name: "lime and lilac",
        style: "mesh",
        seed: 47639,
        colors: ["#bfdc23", "#87e15f", "#5e42f3", "#cd94e7"],
        lightAngle: 238,
        grain: 45,
      },
      {
        name: "indigo and apricot",
        style: "mesh",
        seed: 6689,
        colors: ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"],
        lightAngle: 307,
        grain: 45,
      },
      {
        name: "sky blue and gold",
        style: "mesh",
        seed: 50096,
        colors: ["#d5af3e", "#acef4e", "#5077ed", "#b790ee"],
        lightAngle: 323,
        grain: 45,
      },
      {
        name: "purple",
        style: "mesh",
        seed: 50915,
        colors: ["#f72585", "#7209b7", "#3a0ca3", "#4cc9f0"],
        lightAngle: 30,
        grain: 45,
      },
      {
        name: "coral",
        style: "mesh",
        seed: 47639,
        colors: ["#d43e56", "#f3b83e", "#60f6df", "#96b1ea"],
        lightAngle: 132,
        grain: 45,
      },
      {
        name: "rust red",
        style: "mesh",
        seed: 5870,
        colors: ["#0d0d0d", "#7a1b2e", "#ff5a36", "#ffd166"],
        lightAngle: 288,
        grain: 45,
      },
      {
        name: "forest green",
        style: "mesh",
        seed: 32897,
        colors: ["#0b3d2e", "#1f8a70", "#bedb39", "#fff275"],
        lightAngle: 165,
        grain: 45,
      },
      {
        name: "midnight lilac",
        style: "mesh",
        seed: 25526,
        colors: ["#0a0a1a", "#1e1b4b", "#8b5cf6", "#f0abfc"],
        lightAngle: 82,
        grain: 45,
      },
      {
        name: "coffee brown",
        style: "mesh",
        seed: 28802,
        colors: ["#3a2618", "#7c5a3f", "#c9a982", "#f4e8d8"],
        lightAngle: 127,
        grain: 45,
      },
      {
        name: "tangerine",
        style: "mesh",
        seed: 137,
        colors: ["#bf1e42", "#f63b38", "#e28d54", "#f0da91"],
        lightAngle: 164,
        grain: 45,
      },
      {
        name: "slate grey",
        style: "mesh",
        seed: 44363,
        colors: ["#0f172a", "#475569", "#cbd5e1", "#f8fafc"],
        lightAngle: 268,
        grain: 45,
      },
    ],
  },
  "aurora-gradient-wallpapers": {
    heading: "12 aurora gradient wallpapers to download.",
    subject: "phone",
    pieces: [
      {
        name: "violet and peach",
        style: "aurora",
        seed: 2594,
        colors: ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"],
        lightAngle: 130,
        grain: 45,
      },
      {
        name: "magenta and blue",
        style: "aurora",
        seed: 18974,
        colors: ["#f72585", "#7209b7", "#3a0ca3", "#4cc9f0"],
        lightAngle: 97,
        grain: 45,
      },
      {
        name: "ember on black",
        style: "aurora",
        seed: 20612,
        colors: ["#0d0d0d", "#7a1b2e", "#ff5a36", "#ffd166"],
        lightAngle: 296,
        grain: 45,
      },
      {
        name: "lime on forest green",
        style: "aurora",
        seed: 35354,
        colors: ["#0b3d2e", "#1f8a70", "#bedb39", "#fff275"],
        lightAngle: 320,
        grain: 45,
      },
      {
        name: "lemon on blue",
        style: "aurora",
        seed: 40268,
        colors: ["#4858cb", "#b341ed", "#ebd84f", "#b3e799"],
        lightAngle: 167,
        grain: 45,
      },
      {
        name: "violet on black",
        style: "aurora",
        seed: 53372,
        colors: ["#0a0a1a", "#1e1b4b", "#8b5cf6", "#f0abfc"],
        lightAngle: 155,
        grain: 45,
      },
      {
        name: "aqua and lime",
        style: "aurora",
        seed: 15698,
        colors: ["#3499c1", "#e556bd", "#c1f441", "#a468ea"],
        lightAngle: 256,
        grain: 45,
      },
      {
        name: "moonlight on navy",
        style: "aurora",
        seed: 56648,
        colors: ["#012a4a", "#2a9df4", "#caf0f8", "#fefae0"],
        lightAngle: 305,
        grain: 45,
      },
      {
        name: "cream on cocoa",
        style: "aurora",
        seed: 59924,
        colors: ["#3a2618", "#7c5a3f", "#c9a982", "#f4e8d8"],
        lightAngle: 222,
        grain: 45,
      },
      {
        name: "plum",
        style: "aurora",
        seed: 54191,
        colors: ["#1a0b2e", "#5b21b6", "#c026d3", "#fb7185"],
        lightAngle: 251,
        grain: 45,
      },
      {
        name: "silver on charcoal",
        style: "aurora",
        seed: 32078,
        colors: ["#0f172a", "#475569", "#cbd5e1", "#f8fafc"],
        lightAngle: 90,
        grain: 45,
      },
      {
        name: "rose on burgundy",
        style: "aurora",
        seed: 16517,
        colors: ["#2b0a0a", "#9f1239", "#f43f5e", "#fecdd3"],
        lightAngle: 195,
        grain: 45,
      },
    ],
  },
  "grainy-gradient-wallpapers": {
    heading: "12 grainy gradient wallpapers to download.",
    subject: "phone",
    adjective: "grainy",
    pieces: [
      {
        name: "plum and amber",
        style: "mesh",
        seed: 6689,
        colors: ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"],
        lightAngle: 248,
        grain: 85,
      },
      {
        name: "mint green",
        style: "liquid",
        seed: 54191,
        colors: ["#2dce6a", "#61e3bd", "#64e6e7", "#9ccfeb"],
        lightAngle: 329,
        grain: 85,
      },
      {
        name: "violet and magenta",
        style: "mesh",
        seed: 29621,
        colors: ["#f72585", "#7209b7", "#3a0ca3", "#4cc9f0"],
        lightAngle: 283,
        grain: 85,
      },
      {
        name: "rust and espresso",
        style: "mesh",
        seed: 9965,
        colors: ["#0d0d0d", "#7a1b2e", "#ff5a36", "#ffd166"],
        lightAngle: 140,
        grain: 85,
      },
      {
        name: "olive",
        style: "mesh",
        seed: 24707,
        colors: ["#0b3d2e", "#1f8a70", "#bedb39", "#fff275"],
        lightAngle: 45,
        grain: 85,
      },
      {
        name: "coral pink",
        style: "liquid",
        seed: 18974,
        colors: ["#c530b1", "#eb3d9f", "#ec6882", "#ea795e"],
        lightAngle: 310,
        grain: 85,
      },
      {
        name: "lavender dusk",
        style: "mesh",
        seed: 15698,
        colors: ["#0a0a1a", "#1e1b4b", "#8b5cf6", "#f0abfc"],
        lightAngle: 176,
        grain: 85,
      },
      {
        name: "flame orange",
        style: "aurora",
        seed: 57467,
        colors: ["#d13123", "#f1ba2c", "#64dde8", "#99b0ea"],
        lightAngle: 60,
        grain: 85,
      },
      {
        name: "denim blue",
        style: "mesh",
        seed: 47639,
        colors: ["#012a4a", "#2a9df4", "#caf0f8", "#fefae0"],
        lightAngle: 293,
        grain: 85,
      },
      {
        name: "mocha",
        style: "mesh",
        seed: 35354,
        colors: ["#3a2618", "#7c5a3f", "#c9a982", "#f4e8d8"],
        lightAngle: 184,
        grain: 85,
      },
      {
        name: "violet and orange",
        style: "liquid",
        seed: 137,
        colors: ["#42ce56", "#5a42ea", "#e37e6e", "#68a8e7"],
        lightAngle: 52,
        grain: 85,
      },
      {
        name: "midnight navy",
        style: "mesh",
        seed: 4232,
        colors: ["#0f172a", "#475569", "#cbd5e1", "#f8fafc"],
        lightAngle: 275,
        grain: 85,
      },
    ],
  },
};

export function galleryShape(landing: Landing): GalleryShape {
  return landing.look.device === "desktop" ? "desktop" : "phone";
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** "Icy blue mesh gradient iPhone wallpaper". */
export function galleryAlt(gallery: Gallery, piece: GalleryPiece): string {
  const words = [
    piece.name,
    gallery.adjective,
    piece.style,
    "gradient",
    gallery.subject,
    "wallpaper",
  ]
    .filter(Boolean)
    .join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Every image of a landing's gallery, ready to draw; empty when it has none. */
export function galleryFor(landing: Landing): GalleryImage[] {
  const gallery = GALLERIES[landing.slug];
  if (!gallery) return [];
  const shape = galleryShape(landing);
  const { w, h, widths } = GALLERY_FILES[shape];
  return gallery.pieces.map((piece) => {
    const alt = galleryAlt(gallery, piece);
    const base = `${GALLERY_DIR}/${landing.slug}/${slugify(alt)}`;
    return {
      piece,
      alt,
      src: `${base}.jpg`,
      srcSet: widths.map((x) => `${base}-${x}w.webp ${x}w`).join(", "),
      width: w,
      height: h,
      studioHref: lookHref(landingPath(landing.slug), piece),
    };
  });
}
