/**
 * Payment API client.
 *
 * The whole cart goes through our own server-side proxy
 * (/api/create-invoice). The browser sends only WHAT is being bought (one
 * entry per card configuration: certificate, variant, add-ons, quantity)
 * plus buyer contact details; the proxy re-resolves every price from the
 * catalog and stores the order in the payments service, which creates the
 * WayForPay invoice on the studio merchant. The browser never talks to the
 * payments service directly and is never trusted with an amount.
 */

import type { AddonSelection } from "@/types/addon";
import type { DeliveryDetails } from "@/types/delivery";

export interface CreateInvoiceItem {
  certificateId: number;
  /** Required for massage courses, ignored for every other type */
  variantId?: string | null;
  /** Add-ons for this card (qty >= 1 each); the route re-validates them */
  addons?: AddonSelection[];
  /** Identical cards, defaults to 1 */
  qty?: number;
}

export interface CreateInvoiceRequest {
  items: CreateInvoiceItem[];
  name: string;
  /** +380XXXXXXXXX - see formatPhoneForAPI() */
  phone: string;
  /** How the BFCard reaches the buyer / recipient; required when the site offers a method */
  delivery?: DeliveryDetails;
}

export interface CreateInvoiceResponse {
  url: string;
  orderReference?: string;
  /**
   * Per-order secret issued by the payments service. Nova Poshta orders keep
   * it and post it to /api/shipments after payment to fetch / create the ТТН
   */
  clientToken?: string;
}

const FALLBACK_ERROR =
  "Не вдалося створити рахунок для оплати. Спробуйте ще раз.";

/**
 * Create a payment invoice for the cart and return the WayForPay URL.
 * Throws an Error with a user-facing (Ukrainian) message on failure.
 */
export async function createPaymentInvoice(
  data: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> {
  const response = await fetch("/api/create-invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error?.message || FALLBACK_ERROR);
  }

  return result;
}
