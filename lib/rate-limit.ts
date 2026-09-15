/**
 * Fixed-window rate limiter kept in module memory.
 *
 * Zero-dependency floor for the invoice endpoint: it stops naive loops
 * (thousands of invoices from one IP) but not a distributed attacker.
 *
 * Serverless caveat: every warm instance holds its own map, so the effective
 * limit is `limit × instances` per window. For a hard guarantee add an edge
 * rule (Vercel → Firewall → Rate limiting) or back this with a shared store
 * (e.g. Upstash Redis). The interface below is store-agnostic on purpose.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Requests left in the current window (0 when blocked) */
  remaining: number;
  /** Seconds until the window resets — use for the Retry-After header */
  retryAfterSeconds: number;
}

export interface RateLimiterOptions {
  /** Max requests per key per window */
  limit: number;
  windowMs: number;
  /** Prune expired buckets once the map grows past this size */
  maxKeys?: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 5000,
}: RateLimiterOptions) {
  const buckets = new Map<string, Bucket>();

  function prune(now: number) {
    if (buckets.size < maxKeys) return;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
    // Still full after pruning = a flood from many distinct keys. Fail open
    // rather than grow without bound; the edge rule is the real defence there.
    if (buckets.size >= maxKeys) buckets.clear();
  }

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      prune(now);

      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
      }

      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000)
      );

      if (bucket.count >= limit) {
        return { allowed: false, remaining: 0, retryAfterSeconds };
      }

      bucket.count += 1;
      return {
        allowed: true,
        remaining: limit - bucket.count,
        retryAfterSeconds,
      };
    },
    /** Drop every bucket (tests) */
    reset() {
      buckets.clear();
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

/**
 * Best-effort client IP. Vercel sets `x-forwarded-for` with the client
 * first; fall back to `x-real-ip`, then to a shared bucket so the limiter
 * still bounds total traffic when no header is present (local dev).
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
