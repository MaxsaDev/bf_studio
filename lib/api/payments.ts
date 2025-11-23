/**
 * Payment API Service
 * Handles all payment-related API calls to BodyFactory backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://bf-club-delta.vercel.app";

export interface CreateInvoiceRequest {
  amount: number;
  orderDescription: string;
  name: string;
  phone: string;
  regular?: "client" | "none" | "once" | "daily" | "weekly" | "monthly" | "yearly" | "quarterly" | "halfyearly";
  regularCount?: number;
  userId?: string;
}

export interface CreateInvoiceResponse {
  success: boolean;
  data: {
    invoiceUrl: string;
    qrCode: string;
    orderReference: string;
  };
  message: string;
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
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
  const response = await fetch(`${API_BASE_URL}/api/v1/payments/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.error?.message || "Failed to create payment invoice"
    );
  }

  return result;
}

/**
 * Format phone number to international format (+380XXXXXXXXX)
 */
export function formatPhoneForAPI(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // If starts with 38, keep it
  if (digits.startsWith("38")) {
    return `+${digits}`;
  }

  // If starts with 0, replace with 380
  if (digits.startsWith("0")) {
    return `+38${digits}`;
  }

  // Otherwise assume it's already correct or add +38
  return `+38${digits}`;
}
