import type { ResolvedCart } from "@/lib/cart";

/**
 * Invoice lines for WayForPay, which prints them on the buyer's fiscal
 * receipt (PRRO): every card at its discounted price, and right under it that
 * card's own add-ons, under their fiscal names from the owner's sheet
 * ('Додаток до масажу «Масаж стоп»').
 *
 * - Grouped per card, never merged across cards: the buyer must see which
 *   card each add-on belongs to. Two cards with candles print candles twice,
 *   once under each card
 * - A cart line of N identical cards prints the card × N and each of its
 *   add-ons × (qty per card × N)
 * - No delivery or other service text: that belongs to the order description
 *   the staff see (admin SMS, Telegram), not to the fiscal record
 * - The lines always add up to the cart total
 */

export interface ReceiptLine {
  name: string;
  /** UAH for one unit */
  price: number;
  count: number;
}

export function buildReceiptLines(cart: ResolvedCart): ReceiptLine[] {
  return cart.lines.flatMap(({ line, order }) => [
    { name: order.description, price: order.finalPrice, count: line.qty },
    ...order.addonLines.map(({ addon, qty }) => ({
      name: addon.fiscalTitle,
      price: addon.price,
      count: qty * line.qty,
    })),
  ]);
}

/** Sum in kopiykas, so a future non-integer price cannot drift */
export function receiptTotalKop(lines: ReceiptLine[]): number {
  return lines.reduce((sum, line) => sum + Math.round(line.price * 100) * line.count, 0);
}
