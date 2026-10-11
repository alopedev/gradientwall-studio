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

/** Devices the pack page lets the buyer switch between. */
export function showcaseDevices(pack: Pick<Pack, "previews">): ShowcaseDevice[] {
  const devices: ShowcaseDevice[] = ["phone"];
  if (pack.previews.some((p) => pieceRenders(p).desktop)) devices.push("desktop");
  return devices;
}

/** The laptop + phone pair a catalog card shows: the pack's first piece. */
export function coverRenders(pack: Pick<Pack, "previews">): PieceRenders {
  return pieceRenders(pack.previews[0]);
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
