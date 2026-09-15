import type { AddonSelection } from "./addon";

/**
 * One BFCard configuration the buyer wants: product, course variant and the
 * add-ons for THAT card. Add-ons are per card on purpose (the sheet's
 * "fine tune per card"): two identical cards with different stickers are two
 * lines.
 */
export interface CartLineInput {
  certificateId: number;
  /** Course variant id; null for every other certificate type */
  variantId: string | null;
  addons: AddonSelection[];
}

export interface CartLine extends CartLineInput {
  /** Stable client-side id: React key and edit target */
  id: string;
  /** Number of identical cards, 1..CART_MAX_LINE_QTY */
  qty: number;
}
