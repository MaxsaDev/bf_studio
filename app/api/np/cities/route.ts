import { NextRequest, NextResponse } from "next/server";
import { LOOKUP_UNAVAILABLE, lookupResponse } from "@/app/api/np/lookup";
import { callService, serviceApiKey } from "@/lib/payment-service";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

/**
 * City lookup proxy for the checkout combobox. Forwards to the payments
 * service (`GET /delivery/cities`), which holds the Nova Poshta key and
 * caches settlements. Rate-limited here so a runaway client cannot burn the
 * service's Nova Poshta quota.
 */

const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

export async function GET(req: NextRequest) {
  const rate = limiter.check(getClientIp(req.headers));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: { message: "Забагато запитів. Спробуйте за хвилину." } },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  if (!serviceApiKey()) {
    return NextResponse.json({ error: { message: LOOKUP_UNAVAILABLE } }, { status: 503 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 60) {
    return NextResponse.json(
      { error: { message: "Введіть принаймні 2 літери" } },
      { status: 400 }
    );
  }

  const result = await callService<Record<string, unknown>>("/delivery/cities", {
    query: { q },
    timeoutMs: 12_000,
  });
  return lookupResponse(
    result,
    "cities",
    "public, max-age=3600, s-maxage=86400",
    "Не вдалося знайти місто. Спробуйте ще раз."
  );
}
