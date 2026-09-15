"use client";

import Image from "next/image";
import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepButton } from "@/components/checkout/step-button";
import { cn } from "@/lib/utils";
import type { AvailableAddon } from "@/lib/addons";
import type { Addon, AddonId } from "@/types/addon";

interface AddonsStepProps {
  available: AvailableAddon[];
  quantities: Partial<Record<AddonId, number>>;
  onChange: (id: AddonId, qty: number) => void;
  addonsTotal: number;
  /** Price of ONE card with the chosen add-ons */
  unitTotal: number;
  /** "Додати в кошик" for a new card, "Зберегти" when editing a cart line */
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
}

/**
 * Stage 1 of checkout ("Товар"): the add-on upsell for one card. One row per
 * add-on offered for the product; a toggle when only one is allowed, a
 * stepper otherwise.
 */
export function AddonsStep({
  available,
  quantities,
  onChange,
  addonsTotal,
  unitTotal,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: AddonsStepProps) {
  const selectedCount = available.filter(
    ({ addon }) => (quantities[addon.id] ?? 0) > 0
  ).length;

  return (
    <div className="space-y-5">
      <ul className="space-y-2.5" aria-label="Додатки до сеансу">
        {available.map(({ addon, maxQty }) => (
          <AddonRow
            key={addon.id}
            addon={addon}
            maxQty={maxQty}
            qty={quantities[addon.id] ?? 0}
            onChange={(qty) => onChange(addon.id, qty)}
          />
        ))}
      </ul>

      <div className="pt-3 space-y-4 border-t border-stone-200/60 dark:border-stone-800/60">
        <div className="flex justify-between items-center text-sm text-stone-600 dark:text-stone-400">
          <span>
            Додатки
            {selectedCount > 0 && (
              <span className="ml-1.5 text-xs text-stone-400 dark:text-stone-500">
                ({selectedCount})
              </span>
            )}
          </span>
          <span className="font-medium text-stone-900 dark:text-stone-100 tabular-nums">
            {addonsTotal > 0 ? `+${addonsTotal} ₴` : "0 ₴"}
          </span>
        </div>
        <div className="flex justify-between items-end pb-3 border-b-2 border-stone-200 dark:border-stone-800">
          <span className="text-xs uppercase tracking-[0.15em] font-medium text-stone-500 dark:text-stone-400">
            Разом за BFCard
          </span>
          <span className="text-3xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50 tabular-nums">
            {unitTotal} ₴
          </span>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            onClick={onPrimary}
            className="w-full h-12 rounded-2xl text-base font-semibold tracking-wide bg-stone-900 dark:bg-stone-50 text-stone-50 dark:text-stone-900 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-2xl shadow-stone-900/20 dark:shadow-stone-950/40 hover:shadow-stone-900/30 dark:hover:shadow-stone-950/60"
          >
            {primaryLabel}
          </Button>
          <button
            type="button"
            onClick={onSecondary}
            className="w-full text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors duration-200 py-2"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AddonRowProps {
  addon: Addon;
  maxQty: number;
  qty: number;
  onChange: (qty: number) => void;
}

function AddonRow({ addon, maxQty, qty, onChange }: AddonRowProps) {
  const selected = qty > 0;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 transition-colors duration-200",
        selected
          ? "bg-white dark:bg-stone-900/60 border-stone-900/15 dark:border-stone-600/60 shadow-sm"
          : "bg-stone-50/60 dark:bg-stone-900/30 border-stone-200/60 dark:border-stone-800/60"
      )}
    >
      <div className="relative h-12 w-12 shrink-0 rounded-full bg-white shadow-sm ring-1 ring-stone-900/5">
        <Image src={addon.icon} alt="" fill unoptimized sizes="48px" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 leading-tight">
          {addon.title}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
          {addon.price} ₴{maxQty > 1 ? " за шт" : ""}
          {qty > 1 ? ` · разом ${addon.price * qty} ₴` : ""}
        </p>
      </div>

      <QuantityControl
        label={addon.title}
        qty={qty}
        maxQty={maxQty}
        onChange={onChange}
      />
    </li>
  );
}

interface QuantityControlProps {
  label: string;
  qty: number;
  maxQty: number;
  onChange: (qty: number) => void;
}

const PILL =
  "h-9 shrink-0 rounded-full px-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95";
const PILL_OFF =
  "border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-900 dark:hover:border-stone-300";
const PILL_ON =
  "bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900";

/** Toggle for a single allowed unit, "Додати" then a stepper for several */
function QuantityControl({ label, qty, maxQty, onChange }: QuantityControlProps) {
  if (maxQty <= 1) {
    const selected = qty > 0;
    return (
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${selected ? "Прибрати" : "Додати"}: ${label}`}
        onClick={() => onChange(selected ? 0 : 1)}
        className={cn(PILL, selected ? PILL_ON : PILL_OFF)}
      >
        {selected ? (
          <span className="flex items-center gap-1">
            <Check className="h-3.5 w-3.5" aria-hidden />
            Додано
          </span>
        ) : (
          "Додати"
        )}
      </button>
    );
  }

  if (qty === 0) {
    return (
      <button
        type="button"
        aria-label={`Додати: ${label}`}
        onClick={() => onChange(1)}
        className={cn(PILL, PILL_OFF)}
      >
        Додати
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-1 shrink-0"
      role="group"
      aria-label={`Кількість: ${label}`}
    >
      <StepButton onClick={() => onChange(qty - 1)} label={`Менше: ${label}`}>
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </StepButton>
      <span
        className="w-6 text-center text-sm font-bold tabular-nums text-stone-900 dark:text-stone-100"
        aria-live="polite"
      >
        {qty}
      </span>
      <StepButton
        onClick={() => onChange(Math.min(maxQty, qty + 1))}
        disabled={qty >= maxQty}
        label={`Більше: ${label}`}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </StepButton>
    </div>
  );
}
