import { coverAspect, isPhoneAndDesktop } from "./index";
import type { Pack, PackCover } from "./types";

export type ShowcaseDevice = "phone" | "desktop";

/** What a piece looks like on each device. `null` = the pack has no render for that device. */
export interface PieceRenders {
  phone: PackCover | null;
  desktop: PackCover | null;
  /** True when the phone shows a centre crop of the landscape file (no separate phone render exists). */
  phoneIsCrop: boolean;
}

/**
 * Splits a manifest piece into the render each device frame shows. A pair
 * (phone file + nested `desktop`) is used as composed; a landscape-only piece
 * fills the phone by `object-fit: cover`, which is how its real phone file is
 * cut (centre crop); a portrait-only piece has nothing for a desktop frame.
 */
export function pieceRenders(piece: PackCover): PieceRenders {
  if (piece.kind === "image" && piece.desktop) {
    const { desktop, ...phone } = piece;
    return {
      phone: { ...phone, kind: "image" },
      desktop: { kind: "image", ...desktop },
      phoneIsCrop: false,
    };
  }
  if (coverAspect(piece) > 1) return { phone: piece, desktop: piece, phoneIsCrop: true };
  return { phone: piece, desktop: null, phoneIsCrop: false };
}

/** What the pack page's stage can show: both devices together, or one alone. */
export type ShowcaseView = "both" | ShowcaseDevice;

/** Views the buyer can switch between; the first is where the page opens. */
export function showcaseViews(pack: Pick<Pack, "previews">): ShowcaseView[] {
  return pack.previews.some((p) => pieceRenders(p).desktop)
    ? ["both", "phone", "desktop"]
    : ["phone"];
}

/** The design's name when its file carries one (`06_halbkreise.png` → "Halbkreise"), else null. */
export function pieceName(piece: PackCover): string | null {
  if (piece.kind !== "image") return null;
  const match = /\/\d+_([^/.]+)\.\w+$/.exec(piece.url);
  if (!match) return null;
  const words = match[1].split("-");
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** A random piece other than the current one (the Shuffle button). */
export function shuffleIndex(
  current: number,
  total: number,
  random: () => number = Math.random,
): number {
  if (total < 2) return current;
  const step = 1 + Math.floor(random() * (total - 1));
  return (current + step) % total;
}

/** The laptop + phone pair a catalog card shows: the pack's first piece. */
export function coverRenders(pack: Pick<Pack, "previews">): PieceRenders {
  return pieceRenders(pack.previews[0]);
}

/** Most phones a catalog card fans out; more would only crowd the card. */
export const FAN_MAX = 5;

export interface FanPiece {
  cover: PackCover;
  /** Position from the centre: 0 is the front phone, ±1 next to it, ±2 at the edges. */
  offset: number;
}

/**
 * The phones a catalog card stacks and fans open: the pack's first pieces,
 * phone renders only, with the cover piece in front at the centre and the
 * rest alternating left and right, ordered left to right.
 */
export function fanPieces(pack: Pick<Pack, "previews">): FanPiece[] {
  return pack.previews
    .slice(0, FAN_MAX)
    .map((piece, i) => ({
      cover: pieceRenders(piece).phone!,
      offset: i === 0 ? 0 : Math.ceil(i / 2) * (i % 2 ? -1 : 1),
    }))
    .sort((a, b) => a.offset - b.offset);
}

export interface PackSpec {
  label: string;
  value: string;
  detail?: string;
}

/** The monospace spec block of a pack page, derived from the manifest so counts never drift from the files. */
export function packSpecs(pack: Pick<Pack, "previews" | "phoneAndDesktop">): PackSpec[] {
  const n = pack.previews.length;
  const format: PackSpec = {
    label: "Format",
    value: "High-quality JPG",
    detail: "Delivered as ZIP",
  };
  const licence: PackSpec = { label: "Licence", value: "Personal use", detail: "Not for resale" };
  if (!isPhoneAndDesktop(pack)) {
    return [
      { label: "Files", value: `${n} ${n === 1 ? "wallpaper" : "wallpapers"}` },
      format,
      licence,
    ];
  }
  return [
    { label: "Desktop", value: `${n} × 4K and 5K`, detail: "3840 × 2160 · 5120 × 2880" },
    { label: "Phone", value: `${n} × iPhone & Android`, detail: "1320 × 2868" },
    format,
    licence,
  ];
}

/** The hero shows a pack piece instead of a new gradient on every this-many shuffles. */
export const PACK_PEEK_EVERY = 5;

export interface PackPeek {
  pack: Pack;
  piece: PackCover;
  /** The piece's phone render, what the hero's screen shows. */
  cover: PackCover;
}

/**
 * Which pack piece the hero's phone shows after `spins` shuffles, or null for
 * a gradient. Each peek goes to the next pack in turn; once every pack has
 * had one, each moves on to its next piece.
 */
export function heroPackPeek(packs: readonly Pack[], spins: number): PackPeek | null {
  if (!packs.length || spins <= 0 || spins % PACK_PEEK_EVERY) return null;
  const k = spins / PACK_PEEK_EVERY - 1;
  const pack = packs[k % packs.length];
  const piece = pack.previews[Math.floor(k / packs.length) % pack.previews.length];
  return { pack, piece, cover: pieceRenders(piece).phone! };
}
