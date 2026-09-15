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
  // `new Date("YYYY-MM-DD")` is UTC midnight, which toLocaleDateString then
  // shifts to the previous day in negative-offset timezones (a Kyiv "23.03"
  // rendered as "22.03" for a visitor in New York). Build date-only strings
  // from their parts in local time so the calendar date survives everywhere.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endDate);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3])
      )
    : new Date(endDate);

  if (Number.isNaN(date.getTime())) return null;

  // Reject rolled-over parts such as "2026-13-45"
  if (
    dateOnly &&
    (date.getMonth() !== Number(dateOnly[2]) - 1 ||
      date.getDate() !== Number(dateOnly[3]))
  ) {
    return null;
  }

  return `до ${date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
  })}`;
}
