import type { ShipmentDeliverySummary } from "@/lib/api/shipments";

/**
 * Browser-side memory of "this order still needs its Nova Poshta waybill".
 * Written right before the redirect to WayForPay, consumed by
 * PendingShipmentProcessor after the payment. localStorage only.
 */

const PENDING_KEY = "bf-pending-shipment";
const RESULT_KEY = "bf-shipment-result";
const PENDING_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const RESULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface PendingShipment {
  orderReference: string;
  /** Per-order secret from the payments service; /api/shipments needs it */
  clientToken: string;
  summary: ShipmentDeliverySummary;
  createdAt: number;
}

export interface ShipmentResult {
  orderReference: string;
  number: string;
  estimatedDeliveryDate: string;
  mock?: boolean;
  summary: ShipmentDeliverySummary;
  createdAt: number;
}

function read<T extends { createdAt: number }>(key: string, maxAgeMs: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as T;
    if (
      !value ||
      typeof value.createdAt !== "number" ||
      Date.now() - value.createdAt > maxAgeMs ||
      !isComplete(value)
    ) {
      window.localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

/** Entries written by an older build (e.g. `token` instead of `clientToken`) are dropped */
function isComplete(value: { createdAt: number }): boolean {
  const v = value as Partial<PendingShipment & ShipmentResult>;
  if (typeof v.orderReference !== "string") return false;
  if ("clientToken" in v || !("number" in v)) return typeof v.clientToken === "string";
  return typeof v.number === "string";
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable - the admin still has the delivery text in the order
  }
}

export function savePendingShipment(value: Omit<PendingShipment, "createdAt">): void {
  write(PENDING_KEY, { ...value, createdAt: Date.now() });
}

export function loadPendingShipment(): PendingShipment | null {
  return read<PendingShipment>(PENDING_KEY, PENDING_MAX_AGE_MS);
}

export function clearPendingShipment(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

export function saveShipmentResult(value: Omit<ShipmentResult, "createdAt">): void {
  write(RESULT_KEY, { ...value, createdAt: Date.now() });
}

export function loadShipmentResult(): ShipmentResult | null {
  return read<ShipmentResult>(RESULT_KEY, RESULT_MAX_AGE_MS);
}
