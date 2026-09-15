"use client";

import { useEffect, useState } from "react";
import { PackageCheck, Truck } from "lucide-react";
import { createShipment } from "@/lib/api/shipments";
import {
  clearPendingShipment,
  loadPendingShipment,
  loadShipmentResult,
  savePendingShipment,
  saveShipmentResult,
  type PendingShipment,
  type ShipmentResult,
} from "@/lib/pending-shipment";
import { track } from "@/lib/analytics";

/**
 * After the buyer paid, WayForPay sends them back to /success-payment. The
 * pending shipment stored before the redirect is posted to /api/shipments,
 * which asks the payments service for the waybill (the service's webhook
 * usually created it already). Also runs silently on the landing page, so a
 * buyer who closed the tab and returns later still sees the ТТН.
 */

export type ShipmentUiState =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "done"; result: ShipmentResult }
  | { kind: "awaiting_payment" };

/**
 * The webhook normally lands within seconds of the redirect. While the
 * service still answers "payment unconfirmed", retry a few times on this
 * visit before leaving it to the next one.
 */
const PENDING_RETRY_DELAYS_MS = [4000, 6000, 8000];

let inFlight = false;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function usePendingShipment(): ShipmentUiState {
  const [state, setState] = useState<ShipmentUiState>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;

    const process = async (pending: PendingShipment) => {
      for (let attempt = 0; ; attempt++) {
        const result = await createShipment({
          orderReference: pending.orderReference,
          clientToken: pending.clientToken,
        });
        if (cancelled) return;

        if (result.ok && (result.data.status === "created" || result.data.status === "exists")) {
          const saved: Omit<ShipmentResult, "createdAt"> = {
            orderReference: pending.orderReference,
            number: result.data.waybill.number,
            estimatedDeliveryDate: result.data.waybill.estimatedDeliveryDate,
            mock: result.data.waybill.mock,
            summary: pending.summary,
          };
          saveShipmentResult(saved);
          clearPendingShipment();
          track("shipment_created", { status: result.data.status });
          setState({ kind: "done", result: { ...saved, createdAt: Date.now() } });
          return;
        }

        if (result.ok && result.data.status === "pending") {
          // Payment not confirmed yet - keep the entry, retry shortly, then on the next visit
          setState({ kind: "awaiting_payment" });
          if (attempt >= PENDING_RETRY_DELAYS_MS.length) return;
          await wait(PENDING_RETRY_DELAYS_MS[attempt]);
          if (cancelled) return;
          continue;
        }

        if (result.ok && result.data.status === "failed") {
          // Declined / expired / nothing to ship: the entry can never succeed
          clearPendingShipment();
          track("shipment_skipped", { reason: result.data.paymentStatus });
          setState({ kind: "idle" });
          return;
        }

        // Not ok: 401/400/404 mean this entry can never succeed - drop it.
        // 429 / 5xx / network mean try again later - keep it.
        if (!result.ok && result.httpStatus >= 400 && result.httpStatus < 500 && result.httpStatus !== 429) {
          clearPendingShipment();
        } else {
          savePendingShipment(pending); // refresh createdAt so it is not aged out too soon
        }
        track("shipment_error", { http_status: result.ok ? 0 : result.httpStatus });
        setState({ kind: "idle" });
        return;
      }
    };

    // Deferred so the effect body itself sets no state (localStorage is
    // client-only, so this cannot run during render either)
    const timer = setTimeout(() => {
      const pending = loadPendingShipment();
      if (!pending) {
        const done = loadShipmentResult();
        if (done) setState({ kind: "done", result: done });
        return;
      }
      if (inFlight) return;
      inFlight = true;
      setState({ kind: "processing" });
      process(pending).finally(() => {
        inFlight = false;
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return state;
}

/** Invisible: landing page background retry */
export function PendingShipmentProcessor() {
  usePendingShipment();
  return null;
}

/** Success page block with the ТТН number */
export function ShipmentStatus() {
  const state = usePendingShipment();
  if (state.kind === "idle") return null;

  return (
    <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-xl p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
          {state.kind === "done" ? (
            <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          ) : (
            <Truck className="w-5 h-5 text-stone-600 dark:text-stone-400" aria-hidden />
          )}
        </div>
        <div className="min-w-0 space-y-1">
          {state.kind === "processing" && (
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Оформлюємо відправлення Новою поштою...
            </p>
          )}
          {state.kind === "awaiting_payment" && (
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Очікуємо підтвердження оплати. Відправлення буде оформлено автоматично.
            </p>
          )}
          {state.kind === "done" && (
            <>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                Відправлення Новою поштою оформлено
                {state.result.mock ? " (демо)" : ""}
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-400 tabular-nums">
                ТТН <span className="font-semibold text-stone-900 dark:text-stone-100">{state.result.number}</span>
                {state.result.estimatedDeliveryDate
                  ? ` · орієнтовно ${state.result.estimatedDeliveryDate}`
                  : ""}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-500">
                {state.result.summary.recipientName}, {state.result.summary.cityName},{" "}
                {state.result.summary.warehouseDescription}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
