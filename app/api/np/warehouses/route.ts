import { NextRequest, NextResponse } from "next/server";
import { LOOKUP_UNAVAILABLE, lookupResponse } from "@/app/api/np/lookup";
import { UUID_REGEX } from "@/lib/delivery";
import { callService, serviceApiKey } from "@/lib/payment-service";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

/** Branch / parcel-locker lookup proxy for one city (see np/cities) */

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

  const cityRef = (req.nextUrl.searchParams.get("cityRef") ?? "").trim();
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!UUID_REGEX.test(cityRef) || q.length > 60) {
    return NextResponse.json(
      { error: { message: "Оберіть місто зі списку" } },
      { status: 400 }
    );
  }

  const result = await callService<Record<string, unknown>>("/delivery/warehouses", {
    query: { cityRef, q },
    timeoutMs: 12_000,
  });
  return lookupResponse(
    result,
    "warehouses",
    "public, max-age=600, s-maxage=3600",
    "Не вдалося завантажити відділення. Спробуйте ще раз."
  );
}
