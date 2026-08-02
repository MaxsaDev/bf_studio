import {
  Certificate,
  CertificateVariant,
  Discount,
} from "@/types/certificate";

export function applyDiscount(price: number, discount?: Discount): number {
  if (!discount) return price;
  return Math.round(price * (1 - discount.percentage / 100));
}

export interface ResolvedPrice {
  basePrice: number;
  finalPrice: number;
  discount?: Discount;
  /** Order description sent to the payment API */
  description: string;
  /** Human-readable name of the purchased item */
  itemTitle: string;
  /** e.g. "10 сеансів" for course variants */
  variantTitle?: string;
  variant?: CertificateVariant;
}

/**
 * Single source of truth for price/discount/description resolution
 * across cards, checkout render and checkout submit.
 */
export function resolvePrice(
  certificate: Certificate,
  variantId?: string | null
): ResolvedPrice {
  if (certificate.type === "massage_course") {
    const variant =
      certificate.variants.find((v) => v.id === variantId) ??
      certificate.variants[0];
    const discount = variant.discount ?? certificate.discount;
    return {
      basePrice: variant.price,
      finalPrice: applyDiscount(variant.price, discount),
      discount,
      description: `${variant.title} - ${certificate.description}`,
      itemTitle: certificate.title,
      variantTitle:
        variant.sessions === 1 ? "1 сеанс" : `${variant.sessions} сеансів`,
      variant,
    };
  }

  const basePrice =
    certificate.type === "gift_certificate" ||
    certificate.type === "named_gift_certificate"
      ? certificate.denomination
      : certificate.price;

  const itemTitle =
    certificate.type === "gift_certificate"
      ? `Сертифікат на ${certificate.denomination} ₴`
      : certificate.title;

  return {
    basePrice,
    finalPrice: applyDiscount(basePrice, certificate.discount),
    discount: certificate.discount,
    description: certificate.description,
    itemTitle,
  };
}

/** "2026-03-01" → "до 01.03" for discount urgency badges */
export function formatDiscountEndDate(endDate: string): string | null {
  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return null;
  return `до ${date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
  })}`;
}
