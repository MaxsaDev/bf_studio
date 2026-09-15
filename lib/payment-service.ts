/**
 * Server-only client for the BodyFactory payments service (bf-back-v2).
 *
 * The service owns everything money- and delivery-related for the shop: the
 * WayForPay invoice, the payment webhook, the certificate order record and
 * the Nova Poshta integration (city / branch lookups, waybills). This app
 * prices the cart, validates input and proxies. Its only secret is the
 * service API key - no WayForPay or Nova Poshta credentials live here.
 *
 * Env (server-side only, see .env.example):
 * - PAYMENT_SERVICE_API_KEY  key from the service's API_KEYS list (required)
 * - PAYMENT_SERVICE_URL      API base, default https://bf-club-delta.vercel.app/api/v1
 *                            (a value ending in /payments, as older deployments
 *                            were configured, is accepted too)
 */

const DEFAULT_API_BASE = "https://bf-club-delta.vercel.app/api/v1";

export function serviceApiBase(): string {
  const raw = process.env.PAYMENT_SERVICE_URL?.trim();
  if (!raw) return DEFAULT_API_BASE;
  return raw.replace(/\/+$/, "").replace(/\/payments$/, "");
}

export function serviceApiKey(): string | null {
  return process.env.PAYMENT_SERVICE_API_KEY?.trim() || null;
}

/** Envelope every bf-back-v2 endpoint answers with */
export interface ServiceEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code?: string; message?: string; details?: unknown };
}

export interface ServiceCall {
  method?: "GET" | "POST";
  /** Appended as ?key=value; undefined and empty values are skipped */
  query?: Record<string, string | undefined>;
  body?: unknown;
  /** Abort after this long. The service retries Nova Poshta with backoff, so waybill calls need more */
  timeoutMs?: number;
}

export interface ServiceResult<T> {
  /** HTTP status; 0 when no answer arrived (network error, timeout) */
  status: number;
  ok: boolean;
  body: ServiceEnvelope<T> | null;
  retryAfter: string | null;
}

/**
 * One call to the service. Never throws for transport or HTTP errors - the
 * caller maps `status` / `body` to its own response. Throws only when the
 * API key is missing, which every route checks up front.
 */
export async function callService<T = unknown>(
  path: string,
  call: ServiceCall = {}
): Promise<ServiceResult<T>> {
  const apiKey = serviceApiKey();
  if (!apiKey) throw new Error("PAYMENT_SERVICE_API_KEY is not set");

  const url = new URL(`${serviceApiBase()}${path}`);
  for (const [key, value] of Object.entries(call.query ?? {})) {
    if (value) url.searchParams.set(key, value);
  }
  const method = call.method ?? "GET";

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        "x-api-key": apiKey,
        ...(call.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: call.body !== undefined ? JSON.stringify(call.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(call.timeoutMs ?? 15_000),
    });
    const body = (await response.json().catch(() => null)) as ServiceEnvelope<T> | null;
    return {
      status: response.status,
      ok: response.ok,
      body,
      retryAfter: response.headers.get("Retry-After"),
    };
  } catch (error) {
    console.error(
      `[payment-service] ${method} ${path} failed:`,
      error instanceof Error ? error.message : error
    );
    return { status: 0, ok: false, body: null, retryAfter: null };
  }
}
