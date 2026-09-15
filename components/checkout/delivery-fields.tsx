"use client";

import { useEffect, useId, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Check, Loader2, MapPin, Package, Store, Truck } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/checkout/checkout-styles";
import type { CheckoutFormValues } from "@/components/checkout/checkout-form-schema";
import { enabledDeliveryMethods } from "@/lib/delivery";
import { formatPhoneDisplay, UA_PHONE_DISPLAY_REGEX } from "@/lib/phone";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import type { DeliveryMethod, NpSettlement, NpWarehouse } from "@/types/delivery";

/**
 * "Отримання BFCard" block on the payment screen: pickup at the studio or
 * Nova Poshta delivery to a recipient (name, phone, city, branch/locker).
 * City and warehouse are looked up through /api/np/*, which proxy the
 * payments service; no Nova Poshta key exists in this app at all.
 */

type LookupStatus = "idle" | "loading" | "error" | "unavailable" | "throttled";

interface LookupState<T> {
  status: LookupStatus;
  items: T[];
}

/**
 * Debounced GET of a lookup URL. Every state change happens inside the timer
 * or the promise, so the effect body itself never sets state.
 */
function useLookup<T>(url: string | null, itemsKey: string, delayMs: number): LookupState<T> {
  const [state, setState] = useState<LookupState<T>>({ status: "idle", items: [] });

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        if (!url) {
          setState({ status: "idle", items: [] });
          return;
        }
        setState((prev) => ({ status: "loading", items: prev.items }));
        fetch(url, { signal: controller.signal })
          .then(async (res) => {
            if (res.status === 503) {
              setState({ status: "unavailable", items: [] });
              return;
            }
            if (res.status === 429) {
              setState({ status: "throttled", items: [] });
              return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setState({ status: "idle", items: (json?.[itemsKey] as T[]) ?? [] });
          })
          .catch((error: unknown) => {
            if (error instanceof DOMException && error.name === "AbortError") return;
            setState({ status: "error", items: [] });
          });
      },
      url ? delayMs : 0
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, itemsKey, delayMs]);

  return state;
}

const OPTION =
  "flex w-full items-start gap-2.5 px-4 py-2.5 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors";
const OPTION_ACTIVE = "bg-stone-100 dark:bg-stone-800";
const LISTBOX =
  "absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl";
const HINT = "px-4 py-3 text-sm text-stone-500 dark:text-stone-400";

/** Shared keyboard handling for both comboboxes */
function useComboboxKeys<T>(
  open: boolean,
  setOpen: (v: boolean) => void,
  options: T[],
  onSelect: (item: T) => void
) {
  const [active, setActive] = useState(-1);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && open) {
      // Close the list only - the dialog's own Escape handler must not fire
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter" && open) {
      // Never submit the form from an open list
      e.preventDefault();
      if (active >= 0 && options[active]) onSelect(options[active]);
    }
  };

  return { active, setActive, onKeyDown };
}

function CityCombobox({ disabled }: { disabled?: boolean }) {
  const form = useFormContext<CheckoutFormValues>();
  const cityRef = form.watch("cityRef");
  const query = form.watch("cityName");
  const [open, setOpen] = useState(false);
  const listId = useId();

  const trimmed = query.trim();
  const url =
    !cityRef && trimmed.length >= 2 ? `/api/np/cities?q=${encodeURIComponent(trimmed)}` : null;
  const { status, items } = useLookup<NpSettlement>(url, "cities", 300);

  const select = (city: NpSettlement) => {
    form.setValue("cityRef", city.cityRef, { shouldValidate: true });
    form.setValue("cityName", city.name, { shouldValidate: true });
    form.setValue("cityPresent", city.present);
    form.setValue("warehouseRef", "");
    form.setValue("warehouseDescription", "");
    form.setValue("warehouseCategory", "");
    setOpen(false);
  };
  const { active, setActive, onKeyDown } = useComboboxKeys(open, setOpen, items, select);
  const showList = open && !cityRef && (trimmed.length >= 2 || status !== "idle");

  return (
    <FormField
      control={form.control}
      name="cityName"
      render={({ field }) => (
        <FormItem>
          <FormLabel className={FIELD_LABEL}>Місто</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                {...field}
                role="combobox"
                aria-expanded={showList}
                aria-controls={listId}
                aria-autocomplete="list"
                autoComplete="off"
                disabled={disabled}
                placeholder="Почніть вводити назву міста"
                className={cn(FIELD_INPUT, cityRef && "pr-11")}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  if (cityRef) {
                    form.setValue("cityRef", "");
                    form.setValue("cityPresent", "");
                    form.setValue("warehouseRef", "");
                    form.setValue("warehouseDescription", "");
                    form.setValue("warehouseCategory", "");
                  }
                  setActive(-1);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={onKeyDown}
              />
            </FormControl>
            {cityRef && (
              <Check
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
            )}
            {showList && (
              <ul id={listId} role="listbox" className={LISTBOX}>
                {status === "loading" && (
                  <li className={cn(HINT, "flex items-center gap-2")}>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Шукаємо...
                  </li>
                )}
                {status === "error" && <li className={HINT}>Не вдалося завантажити. Спробуйте ще раз.</li>}
                {status === "throttled" && (
                  <li className={HINT}>Забагато запитів. Зачекайте кілька секунд і спробуйте ще раз.</li>
                )}
                {status === "unavailable" && (
                  <li className={HINT}>Доставка Новою поштою тимчасово недоступна.</li>
                )}
                {status === "idle" && items.length === 0 && <li className={HINT}>Нічого не знайдено</li>}
                {items.map((city, i) => (
                  <li key={city.ref} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => select(city)}
                      className={cn(OPTION, i === active && OPTION_ACTIVE)}
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block">{city.present}</span>
                        <span className="block text-xs text-stone-400 dark:text-stone-500">
                          {city.warehouses} відділень і поштоматів
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <FormMessage className="text-xs mt-1.5" />
        </FormItem>
      )}
    />
  );
}

type CategoryFilter = "all" | "Branch" | "Postomat";

function WarehouseCombobox({ disabled }: { disabled?: boolean }) {
  const form = useFormContext<CheckoutFormValues>();
  const cityRef = form.watch("cityRef");
  const warehouseRef = form.watch("warehouseRef");
  const query = form.watch("warehouseDescription");
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const listId = useId();

  const trimmed = warehouseRef ? "" : query.trim();
  const url = cityRef
    ? `/api/np/warehouses?cityRef=${encodeURIComponent(cityRef)}${trimmed ? `&q=${encodeURIComponent(trimmed)}` : ""}`
    : null;
  const { status, items } = useLookup<NpWarehouse>(url, "warehouses", trimmed ? 300 : 0);
  const visible = items.filter((w) => filter === "all" || w.category === filter);

  const select = (warehouse: NpWarehouse) => {
    form.setValue("warehouseRef", warehouse.ref, { shouldValidate: true });
    form.setValue("warehouseDescription", warehouse.description, { shouldValidate: true });
    form.setValue("warehouseCategory", warehouse.category);
    setOpen(false);
  };
  const { active, setActive, onKeyDown } = useComboboxKeys(open, setOpen, visible, select);
  const showList = open && !!cityRef && !warehouseRef;

  return (
    <FormField
      control={form.control}
      name="warehouseDescription"
      render={({ field }) => (
        <FormItem>
          <div className="mb-2 flex items-center justify-between gap-3">
            <FormLabel className={cn(FIELD_LABEL, "mb-0")}>Відділення або поштомат</FormLabel>
            <div role="group" aria-label="Тип пункту" className="flex gap-1">
              {(
                [
                  ["all", "Усі"],
                  ["Branch", "Відділення"],
                  ["Postomat", "Поштомати"],
                ] as [CategoryFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    filter === value
                      ? "bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900"
                      : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <FormControl>
              <Input
                {...field}
                role="combobox"
                aria-expanded={showList}
                aria-controls={listId}
                aria-autocomplete="list"
                autoComplete="off"
                disabled={disabled || !cityRef}
                placeholder={cityRef ? "Номер або вулиця" : "Спочатку оберіть місто"}
                className={cn(FIELD_INPUT, warehouseRef && "pr-11")}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  if (warehouseRef) {
                    form.setValue("warehouseRef", "");
                    form.setValue("warehouseCategory", "");
                  }
                  setActive(-1);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={onKeyDown}
              />
            </FormControl>
            {warehouseRef && (
              <Check
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
            )}
            {showList && (
              <ul id={listId} role="listbox" className={LISTBOX}>
                {status === "loading" && (
                  <li className={cn(HINT, "flex items-center gap-2")}>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Завантажуємо...
                  </li>
                )}
                {status === "error" && <li className={HINT}>Не вдалося завантажити. Спробуйте ще раз.</li>}
                {status === "throttled" && (
                  <li className={HINT}>Забагато запитів. Зачекайте кілька секунд і спробуйте ще раз.</li>
                )}
                {status === "unavailable" && (
                  <li className={HINT}>Доставка Новою поштою тимчасово недоступна.</li>
                )}
                {status === "idle" && visible.length === 0 && <li className={HINT}>Нічого не знайдено</li>}
                {visible.map((warehouse, i) => (
                  <li key={warehouse.ref} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => select(warehouse)}
                      className={cn(OPTION, i === active && OPTION_ACTIVE)}
                    >
                      {warehouse.category === "Postomat" ? (
                        <Package className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                      ) : (
                        <Store className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                      )}
                      <span className="min-w-0 flex-1">{warehouse.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <FormMessage className="text-xs mt-1.5" />
        </FormItem>
      )}
    />
  );
}

function MethodOption({
  method,
  selected,
  onSelect,
}: {
  method: DeliveryMethod;
  selected: boolean;
  onSelect: () => void;
}) {
  const label =
    method === "pickup" ? siteConfig.delivery.pickup.label : siteConfig.delivery.novaPoshta.label;
  const Icon = method === "pickup" ? Store : Truck;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200",
        selected
          ? "border-stone-900 dark:border-stone-100 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm"
          : "border-stone-200/60 dark:border-stone-800/60 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

export function DeliveryFields({ disabled }: { disabled?: boolean }) {
  const form = useFormContext<CheckoutFormValues>();
  const methods = enabledDeliveryMethods();
  const method = form.watch("deliveryMethod");
  const buyerName = form.watch("name");
  const buyerPhone = form.watch("phone");

  if (methods.length === 0) return null;

  const canCopyBuyer = buyerName.trim().length >= 2 && UA_PHONE_DISPLAY_REGEX.test(buyerPhone);
  const copyBuyer = () => {
    form.setValue("recipientName", buyerName.trim(), { shouldValidate: true });
    form.setValue("recipientPhone", buyerPhone, { shouldValidate: true });
  };

  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-2xl border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30 p-4"
    >
      <legend className="px-1 text-[11px] uppercase tracking-[0.15em] font-medium text-stone-600 dark:text-stone-400">
        Отримання BFCard
      </legend>

      {methods.length > 1 && (
        <FormField
          control={form.control}
          name="deliveryMethod"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div role="radiogroup" aria-label="Спосіб отримання" className="grid grid-cols-2 gap-2">
                  {methods.map((m) => (
                    <MethodOption
                      key={m}
                      method={m}
                      selected={field.value === m}
                      onSelect={() => field.onChange(m)}
                    />
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      )}

      <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
        {method === "pickup" ? siteConfig.delivery.pickup.note : siteConfig.delivery.novaPoshta.note}
      </p>

      {method === "nova_poshta" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300">Отримувач</p>
            {canCopyBuyer && (
              <button
                type="button"
                onClick={copyBuyer}
                className="text-xs font-medium text-stone-500 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                Той самий, що й покупець
              </button>
            )}
          </div>

          <FormField
            control={form.control}
            name="recipientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={FIELD_LABEL}>Ім'я та прізвище отримувача</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="off" placeholder="Олена Петренко" className={FIELD_INPUT} />
                </FormControl>
                <FormMessage className="text-xs mt-1.5" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recipientPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={FIELD_LABEL}>Телефон отримувача</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder="+38 (0__) ___-__-__"
                    className={cn(FIELD_INPUT, "font-mono")}
                    onChange={(e) => field.onChange(formatPhoneDisplay(e.target.value))}
                    maxLength={19}
                  />
                </FormControl>
                <FormMessage className="text-xs mt-1.5" />
              </FormItem>
            )}
          />
          <CityCombobox disabled={disabled} />
          <WarehouseCombobox disabled={disabled} />
        </div>
      )}
    </fieldset>
  );
}
