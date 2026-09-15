"use client";

import { cn } from "@/lib/utils";
import { formatDiscountEndDate } from "@/lib/pricing";
import type { ResolvedCart } from "@/lib/cart";

/**
 * The purchase list on the payment screen: one block per cart line (card,
 * variant, quantity, discount, that card's add-ons), then the total.
 */
export function OrderSummary({
  cart,
  deliveryLabel,
}: {
  cart: ResolvedCart;
  /** e.g. "Нова пошта · оплата при отриманні"; omitted when delivery is not offered */
  deliveryLabel?: string;
}) {
  const hasDiscount = cart.lines.some((l) => l.order.discount);

  return (
    <div className="space-y-3" aria-label="Список покупки">
      <ul className="space-y-3 text-sm">
        {cart.lines.map(({ line, order, lineTotal }) => {
          const deadline = order.discount?.endDate
            ? formatDiscountEndDate(order.discount.endDate)
            : null;
          return (
            <li key={line.id} className="space-y-1">
              <div className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-stone-900 dark:text-stone-100">
                    {order.itemTitle}
                  </span>
                  <span className="block text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                    {[
                      order.variantTitle,
                      `${line.qty} шт`,
                      line.qty > 1 ? `${order.total} ₴ за шт` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  {order.discount && (
                    <span className="flex items-center justify-end gap-1.5 text-xs text-stone-400 dark:text-stone-500">
                      <span className="line-through decoration-stone-400/50">
                        {order.basePrice * line.qty} ₴
                      </span>
                      <span className="px-1.5 py-0.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-bold uppercase tracking-wider">
                        {order.discount.label ?? `-${order.discount.percentage}%`}
                        {deadline ? ` ${deadline}` : ""}
                      </span>
                    </span>
                  )}
                  <span
                    className={cn(
                      "block font-medium",
                      order.discount
                        ? "text-red-600 dark:text-red-400"
                        : "text-stone-900 dark:text-stone-100"
                    )}
                  >
                    {lineTotal} ₴
                  </span>
                </span>
              </div>

              {order.addonLines.map(({ addon, qty, total }) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between gap-4 pl-3 text-xs text-stone-500 dark:text-stone-400 tabular-nums"
                >
                  <span className="min-w-0 truncate">
                    Додаток: {addon.title}
                    {qty > 1 ? ` ${qty} шт` : ""}
                  </span>
                  <span className="shrink-0">
                    {line.qty > 1 ? `${total} ₴ × ${line.qty}` : `${total} ₴`}
                  </span>
                </div>
              ))}
            </li>
          );
        })}
      </ul>

      {deliveryLabel && (
        <div className="flex items-center justify-between gap-4 text-sm text-stone-600 dark:text-stone-400">
          <span>Отримання</span>
          <span className="text-right text-stone-900 dark:text-stone-100">{deliveryLabel}</span>
        </div>
      )}

      <div className="flex justify-between items-end pt-3 pb-3 border-t border-b-2 border-stone-200 dark:border-stone-800">
        <span className="text-xs uppercase tracking-[0.15em] font-medium text-stone-500 dark:text-stone-400">
          До сплати
        </span>
        <span
          className={cn(
            "text-3xl font-serif font-bold tracking-tight tabular-nums",
            hasDiscount
              ? "text-red-600 dark:text-red-400"
              : "text-stone-900 dark:text-stone-50"
          )}
        >
          {cart.total} ₴
        </span>
      </div>
    </div>
  );
}
