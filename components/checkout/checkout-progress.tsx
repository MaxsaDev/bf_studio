"use client";

import { cn } from "@/lib/utils";

/** The three stages of buying: configure a card, review the cart, pay */
export type CheckoutScreen = "product" | "cart" | "payment";

const STEPS: { screen: CheckoutScreen; label: string }[] = [
  { screen: "product", label: "Товар" },
  { screen: "cart", label: "Кошик" },
  { screen: "payment", label: "Оплата" },
];

export function CheckoutProgress({ current }: { current: CheckoutScreen }) {
  const currentIndex = STEPS.findIndex((s) => s.screen === current);

  return (
    <ol
      className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] font-medium"
      aria-label="Етапи оформлення"
    >
      {STEPS.map((step, i) => (
        <li key={step.screen} className="flex items-center gap-2">
          {i > 0 && (
            <span
              aria-hidden
              className={cn(
                "h-px w-4",
                i <= currentIndex
                  ? "bg-stone-900 dark:bg-stone-100"
                  : "bg-stone-300 dark:bg-stone-700"
              )}
            />
          )}
          <span
            aria-current={i === currentIndex ? "step" : undefined}
            className={cn(
              i === currentIndex
                ? "text-stone-900 dark:text-stone-100"
                : i < currentIndex
                  ? "text-stone-500 dark:text-stone-400"
                  : "text-stone-400 dark:text-stone-600"
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
