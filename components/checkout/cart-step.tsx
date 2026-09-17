"use client";

import { Fragment } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StepButton } from "@/components/checkout/step-button";
import { CART_MAX_LINE_QTY, type ResolvedCart, type ResolvedCartLine } from "@/lib/cart";

interface CartStepProps {
  cart: ResolvedCart;
  /** Whether "Змінити додатки" makes sense for this line (product offers add-ons) */
  canEditAddons: (line: ResolvedCartLine) => boolean;
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onEditAddons: (id: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
  onClear: () => void;
}

const PRIMARY_BUTTON =
  "w-full h-12 rounded-2xl text-base font-semibold tracking-wide bg-stone-900 dark:bg-stone-50 text-stone-50 dark:text-stone-900 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-2xl shadow-stone-900/20 dark:shadow-stone-950/40 hover:shadow-stone-900/30 dark:hover:shadow-stone-950/60";
const TEXT_BUTTON =
  "w-full text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors duration-200 py-2";

/** Stage 2 of checkout: every configured card, quantities, totals */
export function CartStep({
  cart,
  canEditAddons,
  onQty,
  onRemove,
  onEditAddons,
  onCheckout,
  onContinueShopping,
  onClear,
}: CartStepProps) {
  if (cart.lines.length === 0) {
    return (
      <div className="space-y-6 py-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-900">
          <ShoppingBag className="h-7 w-7 text-stone-400" aria-hidden />
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Тут з'являться обрані BFCard. Додайте першу з каталогу.
        </p>
        <Button type="button" onClick={onContinueShopping} className={PRIMARY_BUTTON}>
          Продовжити покупки
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-2.5" aria-label="Товари в кошику">
        <AnimatePresence initial={false}>
          {cart.lines.map((resolved) => (
            <CartLineRow
              key={resolved.line.id}
              resolved={resolved}
              canEditAddons={canEditAddons(resolved)}
              onQty={(qty) => onQty(resolved.line.id, qty)}
              onRemove={() => onRemove(resolved.line.id)}
              onEditAddons={() => onEditAddons(resolved.line.id)}
            />
          ))}
        </AnimatePresence>
      </ul>

      <div className="pt-3 space-y-4 border-t border-stone-200/60 dark:border-stone-800/60">
        <div className="flex justify-between items-center text-sm text-stone-600 dark:text-stone-400">
          <span>BFCard у кошику</span>
          <span className="font-medium text-stone-900 dark:text-stone-100 tabular-nums">
            {cart.count}
          </span>
        </div>
        <div className="flex justify-between items-end pb-3 border-b-2 border-stone-200 dark:border-stone-800">
          <span className="text-xs uppercase tracking-[0.15em] font-medium text-stone-500 dark:text-stone-400">
            До сплати
          </span>
          <span className="text-3xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50 tabular-nums">
            {cart.total} ₴
          </span>
        </div>

        <div className="space-y-3">
          <Button type="button" onClick={onCheckout} className={PRIMARY_BUTTON}>
            Оформити замовлення
          </Button>
          <button type="button" onClick={onContinueShopping} className={TEXT_BUTTON}>
            Продовжити покупки
          </button>
          <button
            type="button"
            onClick={onClear}
            className="w-full text-xs text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 py-1"
          >
            Очистити кошик
          </button>
        </div>
      </div>
    </div>
  );
}

interface CartLineRowProps {
  resolved: ResolvedCartLine;
  canEditAddons: boolean;
  onQty: (qty: number) => void;
  onRemove: () => void;
  onEditAddons: () => void;
}

function CartLineRow({
  resolved,
  canEditAddons,
  onQty,
  onRemove,
  onEditAddons,
}: CartLineRowProps) {
  const { line, order, lineTotal } = resolved;
  const metaParts = [order.variantTitle, `${order.total} ₴ за шт`].filter(Boolean);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-stone-200/60 dark:border-stone-800/60 bg-white dark:bg-stone-900/60 p-3.5 shadow-sm space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100 leading-tight truncate">
            {order.itemTitle}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
            {/* Wraps only between parts, never inside "13300 ₴ за шт" */}
            {metaParts.map((part, i) => (
              <Fragment key={i}>
                {i > 0 && " · "}
                <span className="whitespace-nowrap">{part}</span>
              </Fragment>
            ))}
            {order.discount && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-bold text-[10px] uppercase tracking-wider">
                {order.discount.label ?? `-${order.discount.percentage}%`}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Видалити: ${order.itemTitle}`}
          className="shrink-0 rounded-full p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {order.addonLines.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1.5" aria-label="Додатки">
          {order.addonLines.map(({ addon, qty }) => (
            <li
              key={addon.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/60 dark:border-stone-800/60 bg-stone-50 dark:bg-stone-900/40 pl-1 pr-2 py-0.5 text-[11px] text-stone-600 dark:text-stone-300"
            >
              <span className="relative h-4 w-4 rounded-full bg-white">
                <Image src={addon.icon} alt="" fill unoptimized sizes="16px" />
              </span>
              {addon.title}
              {qty > 1 ? ` ${qty} шт` : ""}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-label={`Кількість: ${order.itemTitle}`}
            className="flex items-center gap-1"
          >
            <StepButton
              onClick={() => onQty(line.qty - 1)}
              disabled={line.qty <= 1}
              label={`Менше: ${order.itemTitle}`}
            >
              <Minus className="h-3.5 w-3.5" aria-hidden />
            </StepButton>
            <span
              className="w-6 text-center text-sm font-bold tabular-nums text-stone-900 dark:text-stone-100"
              aria-live="polite"
            >
              {line.qty}
            </span>
            <StepButton
              onClick={() => onQty(line.qty + 1)}
              disabled={line.qty >= CART_MAX_LINE_QTY}
              label={`Більше: ${order.itemTitle}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </StepButton>
          </div>
          {canEditAddons && (
            <button
              type="button"
              onClick={onEditAddons}
              className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-2 decoration-stone-300 transition-colors"
            >
              {order.addonLines.length > 0 ? "Змінити додатки" : "Додати додатки"}
            </button>
          )}
        </div>
        <span className="text-base font-bold tabular-nums text-stone-900 dark:text-stone-100">
          {lineTotal} ₴
        </span>
      </div>
    </motion.li>
  );
}
