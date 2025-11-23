"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Discount, CertificateVariant } from "@/types/certificate";

interface CertificateCardControlsProps {
  price: number;
  discount?: Discount;
  variants?: CertificateVariant[];
  selectedVariantId?: string;
  onVariantChange?: (variantId: string) => void;
  onBuy?: () => void;
  className?: string;
  isActive?: boolean;
}

export function CertificateCardControls({
  price,
  discount,
  variants,
  selectedVariantId,
  onVariantChange,
  onBuy,
  className,
  isActive = true,
}: CertificateCardControlsProps) {
  // Calculate discounted price if discount exists
  const finalPrice = discount
    ? Math.round(price * (1 - discount.percentage / 100))
    : price;

  return (
    <div
      className={cn(
        "mt-5 space-y-5 px-1 transition-all duration-300",
        isActive
          ? "opacity-100 pointer-events-auto transform-none"
          : "opacity-0 pointer-events-none translate-y-4",
        className
      )}
      aria-hidden={!isActive}
    >
      {/* Variant Switcher */}
      {variants && variants.length > 0 && onVariantChange && (
        <div className="relative p-1 bg-stone-100 dark:bg-stone-900/50 rounded-full flex overflow-hidden">
          <div className="absolute inset-0 pointer-events-none border border-stone-200 dark:border-stone-800 rounded-full" />

          {variants.map((variant) => {
            const isSelected = selectedVariantId === variant.id;
            return (
              <button
                key={variant.id}
                onClick={() => isActive && onVariantChange(variant.id)}
                disabled={!isActive}
                className={cn(
                  "relative flex-1 text-sm font-bold py-2.5 transition-colors duration-200 z-10 font-sans whitespace-nowrap px-2",
                  isSelected
                    ? "text-stone-900 dark:text-stone-50"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId={
                      isActive
                        ? `activeTab-${variants.map((v) => v.id).join("-")}`
                        : undefined
                    } // This ID is unique per list of variants, which is same for all cards of same type
                    className="absolute inset-0 bg-white dark:bg-stone-800 shadow-sm rounded-full m-0.5"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{variant.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Price & Action */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          {discount && (
            <div className="flex items-center gap-2 text-sm font-medium text-stone-500 dark:text-stone-400 line-through decoration-stone-400/50 dark:decoration-stone-500/50">
              <span>{price} ₴</span>
              <span className="no-underline text-xs px-1.5 py-0.5 rounded-sm bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold">
                -{discount.percentage}%
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <motion.span
              key={finalPrice}
              initial={{ opacity: 0.5, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-4xl sm:text-5xl font-sans font-bold",
                discount
                  ? "text-red-600 dark:text-red-400"
                  : "text-stone-900 dark:text-stone-50"
              )}
            >
              {finalPrice}
            </motion.span>
            <span className="text-xl sm:text-2xl font-medium text-stone-500 dark:text-stone-400">
              ₴
            </span>
          </div>
        </div>

        <Button
          onClick={onBuy}
          disabled={!isActive}
          className="h-14 px-10 rounded-full bg-stone-900 dark:bg-stone-50 text-stone-50 dark:text-stone-900 text-lg font-bold shadow-lg shadow-stone-900/10 hover:scale-105 active:scale-95 transition-all duration-300 font-sans"
        >
          Придбати
        </Button>
      </div>
    </div>
  );
}
