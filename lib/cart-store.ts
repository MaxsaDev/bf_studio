import { track } from "@/lib/analytics";
import {
  addToCart,
  removeFromCart,
  setCartLineQty,
  updateCartLineAddons,
} from "@/lib/cart";
import { CART_STORAGE_KEY, loadCart, saveCart } from "@/lib/cart-storage";
import type { AddonSelection } from "@/types/addon";
import type { CartLine, CartLineInput } from "@/types/cart";

/**
 * Module-level cart store consumed through `useSyncExternalStore` (see
 * lib/use-cart.ts). The server snapshot is always empty and localStorage is
 * read lazily on the first client snapshot, so SSR and hydration agree and
 * no effect has to set state. Other tabs stay in sync via the `storage` event.
 */

const EMPTY: CartLine[] = [];
let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function replace(next: CartLine[]) {
  lines = next;
  loaded = true;
  saveCart(next);
  notify();
}

function handleStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== CART_STORAGE_KEY) return;
  lines = loadCart();
  notify();
}

export const cartStore = {
  subscribe(listener: () => void): () => void {
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  },

  getSnapshot(): CartLine[] {
    if (!loaded && typeof window !== "undefined") {
      lines = loadCart();
      loaded = true;
    }
    return lines;
  },

  getServerSnapshot(): CartLine[] {
    return EMPTY;
  },

  add(input: CartLineInput, qty = 1): void {
    replace(addToCart(cartStore.getSnapshot(), input, qty));
    track("cart_add", {
      certificate_id: input.certificateId,
      variant_id: input.variantId ?? undefined,
      addons_count: input.addons.length,
      qty,
    });
  },

  remove(id: string): void {
    replace(removeFromCart(cartStore.getSnapshot(), id));
    track("cart_remove", { line_id: id });
  },

  setQty(id: string, qty: number): void {
    replace(setCartLineQty(cartStore.getSnapshot(), id, qty));
    track("cart_qty", { line_id: id, qty });
  },

  updateAddons(id: string, addons: AddonSelection[]): void {
    replace(updateCartLineAddons(cartStore.getSnapshot(), id, addons));
    track("cart_addons_updated", { line_id: id, addons_count: addons.length });
  },

  clear(): void {
    replace(EMPTY);
    track("cart_clear");
  },

  /** Tests only: forget everything, including the lazy-load flag */
  reset(): void {
    lines = EMPTY;
    loaded = false;
    notify();
  },
};
