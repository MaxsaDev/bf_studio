import { NextResponse } from "next/server";
import type { ServiceResult } from "@/lib/payment-service";

/**
 * Shared response mapping for the two Nova Poshta lookup proxies. The
 * payments service answers `{ success, data: { cities | warehouses } }`; the
 * browser gets the plain list, cacheable, or a short Ukrainian error.
 */

export const LOOKUP_UNAVAILABLE = "Доставка тимчасово недоступна";

export function lookupResponse(
  result: ServiceResult<Record<string, unknown>>,
  key: "cities" | "warehouses",
  cacheControl: string,
  failureMessage: string
) {
  const list = result.body?.data?.[key];
  if (result.ok && result.body?.success && Array.isArray(list)) {
    return NextResponse.json(
      { [key]: list },
      { headers: { "Cache-Control": cacheControl } }
    );
  }

  switch (result.status) {
    case 429:
      return NextResponse.json(
        { error: { message: "Забагато запитів до Нової пошти. Спробуйте за кілька секунд." } },
        { status: 429, headers: { "Retry-After": result.retryAfter ?? "3" } }
      );
    case 503:
      return NextResponse.json({ error: { message: LOOKUP_UNAVAILABLE } }, { status: 503 });
    case 400:
      return NextResponse.json(
        { error: { message: result.body?.error?.message ?? "Invalid request" } },
        { status: 400 }
      );
    default:
      console.error(`[np/${key}] service failure:`, result.status, result.body?.error);
      return NextResponse.json({ error: { message: failureMessage } }, { status: 502 });
  }
}
