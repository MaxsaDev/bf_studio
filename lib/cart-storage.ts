import { sanitizeCartLines } from "@/lib/cart";
import type { CartLine } from "@/types/cart";

/**
 * localStorage persistence for the cart. Survives reloads and closed tabs;
 * every read is sanitised against the catalog so stale data cannot break
 * the checkout. Cleared on the success page.
 */

export const CART_STORAGE_KEY = "bf-cart-v1";

export function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? sanitizeCartLines(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveCart(lines: CartLine[]): void {
  try {
    if (lines.length === 0) window.localStorage.removeItem(CART_STORAGE_KEY);
    else window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage unavailable (private mode, quota) - the in-memory cart still works
  }
}

export function clearCartStorage(): void {
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // ignore
  }
}
