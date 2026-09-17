import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

import { callService, serviceApiKey } from "@/lib/payment-service";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import type { DeliveryMethod } from "@/types/delivery";

/**
 * Makes sure a PAID Nova Poshta order has its waybill (ТТН).
 *
 * The payments service (bf-back-v2) owns the order: its WayForPay webhook
 * marks the order paid and creates the waybill right away. This route is the
 * browser's way to catch up - the success page (and any later visit) posts
 * the order's client token here, and the service returns the waybill it
 * already created, creates it now, or says the payment is still unconfirmed
 * (202: try again later). Nothing ships unpaid: the service checks its own
 * payment record, never anything the browser claims.
 */

/** The service retries Nova Poshta with backoff; give it room */
export const maxDuration = 30;

const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
/** Orders being processed right now on this instance (double-click guard) */
const inFlight = new Set<string>();

const requestSchema = z.object({
  orderReference: z.string().min(1).max(200),
  clientToken: z.string().min(16).max(64),
});

interface ShipmentData {
  status: "created" | "exists" | "pending" | "not_applicable";
  waybill?: { number: string; estimatedDeliveryDate: string; mock: boolean };
  paymentStatus?: string;
  delivery?: {
    method: DeliveryMethod;
    recipientName?: string;
    cityName?: string;
    warehouseDescription?: string;
  };
}

function errorResponse(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: { message } }, { status, headers });
}

export async function POST(req: NextRequest) {
  const rate = limiter.check(getClientIp(req.headers));
  if (!rate.allowed) {
    return errorResponse("Забагато спроб. Зачекайте хвилину.", 429, {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  if (!serviceApiKey()) {
    return errorResponse("Автоматичне оформлення відправлення не налаштоване", 503);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return errorResponse("Invalid request body", 400);
  }
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) return errorResponse("Missing or invalid fields", 400);
  const { orderReference, clientToken } = parsed.data;

  if (inFlight.has(orderReference)) {
    return NextResponse.json({ status: "pending", paymentStatus: "processing" }, { status: 202 });
  }
  inFlight.add(orderReference);

  try {
    const result = await callService<ShipmentData>(
      `/certificates/orders/${encodeURIComponent(orderReference)}/shipment`,
      { method: "POST", body: { clientToken }, timeoutMs: 28_000 }
    );
    const data = result.body?.success ? result.body.data : undefined;

    if (result.status === 202 || data?.status === "pending") {
      return NextResponse.json(
        { status: "pending", paymentStatus: data?.paymentStatus ?? "created" },
        { status: 202 }
      );
    }

    if (result.ok && data?.waybill && (data.status === "created" || data.status === "exists")) {
      if (data.status === "created") {
        console.info("[shipments] waybill created", { orderReference, number: data.waybill.number });
      }
      return NextResponse.json({
        status: data.status,
        waybill: data.waybill,
        delivery: {
          recipientName: data.delivery?.recipientName ?? "",
          cityName: data.delivery?.cityName ?? "",
          warehouseDescription: data.delivery?.warehouseDescription ?? "",
        },
      });
    }

    if (result.ok && data?.status === "not_applicable") {
      // Pickup / electronic order: nothing to ship, the browser drops its pending entry
      return NextResponse.json(
        { status: "failed", paymentStatus: "not_applicable" },
        { status: 409 }
      );
    }

    switch (result.status) {
      case 401:
        return errorResponse("Недійсний токен відправлення", 401);
      case 404:
        return errorResponse("Замовлення не знайдено", 404);
      case 429:
        return errorResponse("Забагато спроб. Зачекайте хвилину.", 429, {
          "Retry-After": result.retryAfter ?? "5",
        });
      case 503:
        return errorResponse("Автоматичне оформлення відправлення не налаштоване", 503);
      default:
        console.error("[shipments] service failure:", result.status, result.body?.error);
        return errorResponse(
          "Не вдалося оформити відправлення автоматично. Адміністратор оформить його вручну.",
          502
        );
    }
  } finally {
    inFlight.delete(orderReference);
  }
}
