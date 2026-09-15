import { type AddonLine, describeAddons, sumAddonLines } from "@/lib/addons";
import { type ResolvedPrice, resolvePrice } from "@/lib/pricing";
import type { Certificate } from "@/types/certificate";

export interface ResolvedOrder extends ResolvedPrice {
  addonLines: AddonLine[];
  /** Sum of all add-on lines (never discounted) */
  addonsTotal: number;
  /** Amount to charge: discounted main item + add-ons */
  total: number;
  /** Full description for the payment service: main item, then add-ons */
  orderDescription: string;
}

/**
 * Single source of truth for the amount of one purchase. The checkout renders
 * it, the payment route recomputes it from the same inputs.
 */
export function resolveOrder(
  certificate: Certificate,
  variantId: string | null | undefined,
  addonLines: AddonLine[] = []
): ResolvedOrder {
  const price = resolvePrice(certificate, variantId);
  const addonsTotal = sumAddonLines(addonLines);

  return {
    ...price,
    addonLines,
    addonsTotal,
    total: price.finalPrice + addonsTotal,
    orderDescription:
      addonLines.length > 0
        ? `${price.description}. Додатки: ${describeAddons(addonLines)}`
        : price.description,
  };
}
