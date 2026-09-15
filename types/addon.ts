/**
 * Add-ons ("додатки") are upsells attached to one BFCard purchase: extra
 * services the studio performs during the session. On the physical card they
 * appear as stickers, three per column left and right of the title; the
 * checkout preview mirrors that placement.
 */

export type AddonId =
  | "foot_massage"
  | "hand_massage"
  | "head_massage"
  | "aroma_oils"
  | "candles"
  | "extra_time";

export interface Addon {
  id: AddonId;
  /** Short title shown in the checkout and in the order summary */
  title: string;
  /** Name for the fiscal receipt (from the sheet, kept for the payment service) */
  fiscalTitle: string;
  /** UAH per unit. Certificate discounts never apply to add-ons */
  price: number;
  /** Sticker artwork, served from /public/addons */
  icon: string;
}

/**
 * Max quantity of each add-on for one product, mirroring the
 * "bf-card-additions" sheet: absent or 0 = not offered, 1 = single toggle,
 * 6 = quantity picker 0..6.
 */
export type AddonLimits = Partial<Record<AddonId, number>>;

/** What the buyer picked. Only add-ons with qty >= 1 are listed */
export interface AddonSelection {
  id: AddonId;
  qty: number;
}
