import type { Colors4, Style } from "../palettes";

export const PACK_STYLES = ["gradient", "acrylic", "fluted", "photo", "bauhaus"] as const;
export type PackStyle = (typeof PACK_STYLES)[number];

/** One image file. Sizes are optional, but give them whenever known: layouts use them to reserve the right box. */
export interface PackImage {
  url: string;
  alt: string;
  /** Pixel size of the file. Only the width ÷ height ratio matters to layout. */
  width?: number;
  height?: number;
}

/**
 * A pack cover or preview can be one of two kinds:
 *
 *  - `gradient` — rendered client-side via the existing engine. Lets us ship
 *    the catalog before any external assets exist; later replaceable per item
 *    by switching the discriminator.
 *  - `image` — points at an external URL (R2 in production, /assets/ in dev).
 *    Used for non-gradient packs (acrylic, fluted, photo) and the eventual
 *    high-fidelity preview imagery. The top-level file is the primary render
 *    (a phone piece for composed packs like Dessau). `desktop`, when present,
 *    is the landscape render of the same piece — composed separately, not a
 *    crop.
 */
export type PackCover =
  | {
      kind: "gradient";
      colors: Colors4;
      style: Style;
      blur: number;
      grain: number;
      seed: number;
    }
  | ({ kind: "image"; desktop?: PackImage } & PackImage);

export interface Pack {
  /** URL slug, e.g. `midnight-velvet`. Stable identifier — never rename. */
  slug: string;
  /** Display name. */
  name: string;
  /** Technical style filter (the user chose this categorization in the PRD). */
  style: PackStyle;
  /** One-paragraph editorial blurb shown on the pack page. */
  description: string;
  /** Tagline shown on the card and page hero (under the name). */
  tagline: string;
  /** Cover used on cards and at the top of the pack page. */
  cover: PackCover;
  /** Individual wallpaper pieces, in display order. Any count ≥ 1; a phone + desktop pair is one piece. */
  previews: PackCover[];
  /** Price in EUR. */
  priceEur: number;
  /**
   * Lemon Squeezy variant ID. Optional during pre-checkout phases — once
   * Semana 2 lands the value is required for any pack to be listed.
   */
  lemonSqueezyVariantId?: string;
  /** Every design ships as both a phone and a desktop file, even when the previews show one render. */
  phoneAndDesktop?: boolean;
  /** Etsy listing the web sends buyers to while it has no checkout of its own. */
  etsyUrl?: string;
  /** Second line of the pack page's h1: what the pack is, in the words people search with. */
  headline?: string;
  /** Page `<title>` for the pack route (the brand is appended). Defaults to the name + count. */
  seoTitle?: string;
  /** Meta description, ≤155 characters. Defaults to `description`, which is too long for a snippet. */
  seoDescription?: string;
}
