import type { Colors4, Style } from "../palettes";

export const PACK_STYLES = ["gradient", "acrylic", "fluted", "photo"] as const;
export type PackStyle = (typeof PACK_STYLES)[number];

/**
 * A pack cover or preview can be one of two kinds:
 *
 *  - `gradient` — rendered client-side via the existing engine. Lets us ship
 *    the catalog before any external assets exist; later replaceable per item
 *    by switching the discriminator.
 *  - `image` — points at an external URL (R2 in production, /assets/ in dev).
 *    Used for non-gradient packs (acrylic, fluted, photo) and the eventual
 *    high-fidelity preview imagery.
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
  | {
      kind: "image";
      url: string;
      alt: string;
    };

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
  /** Individual wallpaper previews. Target = 10 in production. */
  previews: PackCover[];
  /** Price in EUR. Flat 4.99 for the launch catalog. */
  priceEur: number;
  /**
   * Lemon Squeezy variant ID. Optional during pre-checkout phases — once
   * Semana 2 lands the value is required for any pack to be listed.
   */
  lemonSqueezyVariantId?: string;
}
