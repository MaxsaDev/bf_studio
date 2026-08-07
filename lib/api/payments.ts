/**
 * Payment API Service
 *
 * Certificate purchases go through our own server-side proxy
 * (/api/create-invoice) which attaches the payment-service API key and
 * selects the studio WayForPay merchant. The browser never talks to the
 * payments service directly.
 */

export interface CreateInvoiceRequest {
  amount: number;
  orderDescription: string;
  name: string;
  phone: string;
  regular?:
    | "client"
    | "none"
    | "once"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "quarterly"
    | "halfyearly";
  regularCount?: number;
  userId?: string;
}

export interface CreateInvoiceResponse {
  url: string;
  orderReference?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    contact?: string;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create a payment invoice
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

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error?.message ||
        "Не вдалося створити рахунок для оплати. Спробуйте ще раз."
    );
  }

  return result;
}
