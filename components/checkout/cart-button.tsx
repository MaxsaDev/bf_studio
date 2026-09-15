"use client";

import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface CartButtonProps {
  /** Number of cards in the cart */
  count: number;
  total: number;
  /** Hidden while the checkout dialog is open */
  visible: boolean;
  onClick: () => void;
}

/** Floating cart pill, top-right, shown only when the cart has something in it */
export function CartButton({ count, total, visible, onClick }: CartButtonProps) {
  return (
    <AnimatePresence>
      {visible && count > 0 && (
        <motion.button
          type="button"
          onClick={onClick}
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          aria-label={`Відкрити кошик: ${count} BFCard, ${total} ₴`}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-45 flex h-11 items-center gap-2.5 rounded-full bg-stone-900 dark:bg-stone-50 pl-3.5 pr-4 text-stone-50 dark:text-stone-900 shadow-2xl shadow-stone-900/25 hover:scale-[1.03] active:scale-95 transition-transform"
        >
          <span className="relative">
            <ShoppingBag className="h-5 w-5" aria-hidden />
            <span className="absolute -top-2 -right-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-stone-900 dark:ring-stone-50">
              {count}
            </span>
          </span>
          <span className="text-sm font-semibold tabular-nums">{total} ₴</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
