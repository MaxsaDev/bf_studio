import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

import { ADDON_IDS, ADDON_MAX_QTY, addons } from "@/data/addons";
import { certificates } from "@/data/certificates";
import { isAddonUpsellEnabled, validateAddonSelection } from "@/lib/addons";
import { CART_MAX_LINES, CART_MAX_LINE_QTY, resolveCart } from "@/lib/cart";
import {
  deliverySchema,
  enabledDeliveryMethods,
  isDeliveryMethodEnabled,
  withDeliveryDescription,
} from "@/lib/delivery";
import { callService, serviceApiKey } from "@/lib/payment-service";
import { UA_PHONE_API_REGEX } from "@/lib/phone";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { buildReceiptLines, receiptTotalKop } from "@/lib/receipt";
import type { CartLine } from "@/types/cart";

/**
 * Server-side proxy to the BodyFactory payments service (bf-back-v2).
 *
 * Why a proxy, and why it owns every price:
 * - the service needs an `x-api-key`, which must never reach the browser;
 * - the browser is never trusted with an amount. It sends only WHAT is being
 *   bought: one entry per card configuration (`certificateId`, `variantId`
 *   for courses, that card's `addons`, `qty`). Prices, add-on eligibility
 *   and the order description are resolved here from `data/certificates.ts`
 *   and `data/addons.ts`, so a tampered request cannot buy a 13 300 ₴ course
 *   for 1 ₴ or attach an add-on the product does not offer;
 * - a small per-IP rate limit bounds invoice spam against the WayForPay
 *   account (see lib/rate-limit.ts for the serverless caveat).
 *
 * The whole cart becomes ONE order in the service (`POST /certificates/orders`)
 * and ONE WayForPay invoice. The service stores the priced items, the buyer
 * and the delivery choice before the invoice exists, so its payment webhook
 * can mark the order paid and create the Nova Poshta waybill on its own.
 *
 * Two texts go out, for two audiences:
 * - `products`: the invoice lines WayForPay prints on the buyer's fiscal
 *   receipt - one per card, one per add-on under its fiscal name, no delivery
 *   (lib/receipt.ts)
 * - `orderDescription`: cards, add-ons and delivery in words (describeCart),
 *   stored with the order for the staff (admin SMS, Telegram)
 *
 * The response carries the order's `clientToken` (issued by the service). For
 * Nova Poshta orders the browser keeps it and later posts it to
 * /api/shipments, which asks the service for the waybill.
 *
 * Env: see lib/payment-service.ts.
 */

const GENERIC_ERROR =
  "Не вдалося створити рахунок для оплати. Спробуйте ще раз.";
const ADDONS_UNAVAILABLE_ERROR =
  "Обрані додатки недоступні для цього сертифіката. Оновіть сторінку та спробуйте ще раз.";

/** 10 attempts per IP per minute - generous for a human, fatal for a loop */
const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

const itemSchema = z.object({
  certificateId: z.number().int().positive(),
  variantId: z.string().min(1).max(50).nullish(),
  addons: z
    .array(
      z.object({
        id: z.enum(ADDON_IDS),
        qty: z.number().int().min(1).max(ADDON_MAX_QTY),
      })
    )
    .max(addons.length)
    .default([]),
  qty: z.number().int().min(1).max(CART_MAX_LINE_QTY).default(1),
});

const requestSchema = z.object({
  items: z.array(itemSchema).min(1).max(CART_MAX_LINES),
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(UA_PHONE_API_REGEX),
  delivery: deliverySchema.optional(),
});

function errorResponse(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: { message } }, { status, headers });
}

export async function POST(req: NextRequest) {
  // Rate limit before parsing so garbage requests count too
  const rate = limiter.check(getClientIp(req.headers));
  if (!rate.allowed) {
    return errorResponse(
      "Забагато спроб. Зачекайте хвилину та спробуйте ще раз.",
      429,
      { "Retry-After": String(rate.retryAfterSeconds) }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("Missing or invalid fields", 400);
  }
  const { items, name, phone, delivery } = parsed.data;

  // Delivery is mandatory whenever the owner offers at least one method
  if (enabledDeliveryMethods().length > 0 && !delivery) {
    return errorResponse("Оберіть спосіб отримання BFCard", 400);
  }
  if (delivery && !isDeliveryMethodEnabled(delivery.method)) {
    return errorResponse("Цей спосіб отримання недоступний", 400);
  }

  // The upsell can be switched off site-wide
  if (items.some((item) => item.addons.length > 0) && !isAddonUpsellEnabled()) {
    return errorResponse(
      "Додатки тимчасово недоступні. Оновіть сторінку та спробуйте ще раз.",
      400
    );
  }

  // Strict per-card validation: real product, real variant, offered add-ons
  const lines: CartLine[] = [];
  for (const [index, item] of items.entries()) {
    const certificate = certificates.find((c) => c.id === item.certificateId);
    if (!certificate) {
      return errorResponse("Unknown certificate", 404);
    }

    const isCourse = certificate.type === "massage_course";
    if (isCourse && !certificate.variants.some((v) => v.id === item.variantId)) {
      return errorResponse("Unknown certificate variant", 400);
    }

    const addonCheck = validateAddonSelection(certificate, item.variantId, item.addons);
    if (!addonCheck.ok) {
      console.warn("[create-invoice] rejected add-ons:", addonCheck.reason);
      return errorResponse(ADDONS_UNAVAILABLE_ERROR, 400);
    }

    lines.push({
      id: `item-${index}`,
      certificateId: certificate.id,
      variantId: isCourse ? (item.variantId as string) : null,
      addons: item.addons,
      qty: item.qty,
    });
  }

  if (!serviceApiKey()) {
    console.error("[create-invoice] PAYMENT_SERVICE_API_KEY is not set");
    return errorResponse("Payment service is not configured", 500);
  }

  const cart = resolveCart(lines);
  if (cart.lines.length !== lines.length || cart.total <= 0) {
    return errorResponse("Invalid order", 400);
  }

  // Becomes the WayForPay orderReference prefix (`${userId}_${ts}`) in
  // bf-back-v2, which keeps studio orders recognisable in the merchant
  // cabinet and Telegram notifications.
  const single = lines.length === 1 && lines[0].qty === 1 ? lines[0] : null;
  const userId = single
    ? `cert_${single.certificateId}_${single.variantId ?? "main"}_${Date.now()}`
    : `cart_${lines.length}_${cart.count}_${Date.now()}`;

  // Priced snapshot for the service's order record (what the admin sees and
  // what a refund or a dispute is checked against). Prices come from the
  // catalog resolution above, never from the request.
  const orderItems = cart.lines.map(({ line, order, lineTotal }) => ({
    certificateId: line.certificateId,
    variantId: line.variantId,
    qty: line.qty,
    title: order.itemTitle,
    ...(order.variantTitle ? { variantTitle: order.variantTitle } : {}),
    unitPrice: order.total,
    lineTotal,
    addons: order.addonLines.map(({ addon, qty }) => ({
      id: addon.id,
      title: addon.title,
      qty,
      price: addon.price,
    })),
  }));

  // The fiscal lines must add up to the charge (the service refuses them
  // otherwise). They always do; if a future pricing change ever breaks that,
  // sell with a single-line receipt instead of failing the purchase.
  const receipt = buildReceiptLines(cart);
  const receiptAddsUp = receiptTotalKop(receipt) === Math.round(cart.total * 100);
  if (!receiptAddsUp) {
    console.error("[create-invoice] receipt lines do not add up", {
      total: cart.total,
      lines: receiptTotalKop(receipt) / 100,
    });
  }

  const result = await callService<{
    invoiceUrl?: string;
    orderReference?: string;
    clientToken?: string;
  }>("/certificates/orders", {
    method: "POST",
    body: {
      amount: cart.total,
      orderDescription: withDeliveryDescription(cart.description, delivery),
      name,
      phone,
      userId,
      items: orderItems,
      delivery,
      ...(receiptAddsUp ? { products: receipt } : {}),
    },
    timeoutMs: 15_000,
  });

  if (result.status === 0) {
    // Network error or timeout - already logged by callService
    return errorResponse(GENERIC_ERROR, 502);
  }

  const data = result.body?.success ? result.body.data : undefined;
  if (!result.ok || !data?.invoiceUrl) {
    console.error("[create-invoice] service error:", result.status, result.body?.error);
    return errorResponse(
      result.body?.error?.message || GENERIC_ERROR,
      result.ok ? 502 : result.status
    );
  }

  return NextResponse.json({
    url: data.invoiceUrl,
    orderReference: data.orderReference,
    ...(data.clientToken ? { clientToken: data.clientToken } : {}),
  });
}
