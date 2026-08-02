/**
 * Payment API Service
 * Handles all payment-related API calls to BodyFactory backend
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bf-club-delta.vercel.app";

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
  const response = await fetch(`${API_BASE_URL}/api/v1/payments`, {
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
