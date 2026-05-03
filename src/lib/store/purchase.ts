import type { Pack } from "../packs";
import { isCheckoutConfigured } from "./checkout";

/**
 * Discriminated result of "can the buyer click Buy on this pack?". Splitting
 * the two failure modes lets the UI tell them apart — "checkout not yet
 * wired" is an environment problem the visitor can't fix, while "no variant
 * yet" is a per-pack pre-launch state. Both still disable the button.
 */
export type PurchaseEligibility =
  | { kind: "buyable"; variantId: string }
  | { kind: "missing-variant" }
  | { kind: "checkout-not-configured" };

/**
 * Order matters: configuration is checked first because if the env var is
 * missing every pack is unbuyable for the same reason — surfacing
 * `missing-variant` would be misleading.
 */
export function canPurchasePack(pack: Pack): PurchaseEligibility {
  if (!isCheckoutConfigured()) return { kind: "checkout-not-configured" };
  if (!pack.lemonSqueezyVariantId) return { kind: "missing-variant" };
  return { kind: "buyable", variantId: pack.lemonSqueezyVariantId };
}
