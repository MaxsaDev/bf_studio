"use client";

import { useMemo, useSyncExternalStore } from "react";
import { cartStore } from "@/lib/cart-store";
import type { AddonSelection } from "@/types/addon";
import type { CartLine, CartLineInput } from "@/types/cart";

export interface CartController {
  lines: CartLine[];
  /** Total number of cards across all lines */
  count: number;
  add: (input: CartLineInput, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  updateAddons: (id: string, addons: AddonSelection[]) => void;
  clear: () => void;
}

/** The cart lives in the page and is handed to the checkout dialog and the cart button */
export function useCart(): CartController {
  const lines = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );

  const count = useMemo(
    () => lines.reduce((sum, line) => sum + line.qty, 0),
    [lines]
  );

  return useMemo(
    () => ({
      lines,
      count,
      add: cartStore.add,
      remove: cartStore.remove,
      setQty: cartStore.setQty,
      updateAddons: cartStore.updateAddons,
      clear: cartStore.clear,
    }),
    [lines, count]
  );
}
