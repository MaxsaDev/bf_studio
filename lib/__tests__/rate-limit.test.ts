import { describe, it, expect } from "vitest";
import { createRateLimiter, getClientIp } from "../rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit within a window, then blocks", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const t0 = 1_000_000;

    expect(limiter.check("a", t0)).toMatchObject({ allowed: true, remaining: 2 });
    expect(limiter.check("a", t0 + 1)).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.check("a", t0 + 2)).toMatchObject({ allowed: true, remaining: 0 });

    const blocked = limiter.check("a", t0 + 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 1).allowed).toBe(false);
    expect(limiter.check("b", 1).allowed).toBe(false);
  });

  it("opens a fresh window once the old one expires", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("a", 999).allowed).toBe(false);
    expect(limiter.check("a", 1000).allowed).toBe(true);
  });

  it("never reports a Retry-After below one second", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.check("a", 0);
    expect(limiter.check("a", 999).retryAfterSeconds).toBe(1);
  });

  it("prunes expired buckets when the map is full", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    limiter.check("a", 0);
    limiter.check("b", 0);
    // Both expired by now → pruned, "a" starts a fresh bucket instead of being blocked
    expect(limiter.check("a", 2000).allowed).toBe(true);
  });

  it("fails open instead of growing without bound under a many-key flood", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 3 });
    limiter.check("a", 0);
    limiter.check("b", 0);
    limiter.check("c", 0);
    // Map is full of live buckets → cleared, so "a" is allowed again
    expect(limiter.check("a", 1).allowed).toBe(true);
  });

  it("reset() clears all buckets", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    limiter.check("a", 0);
    limiter.reset();
    expect(limiter.check("a", 1).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("takes the first x-forwarded-for hop", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then to a shared bucket", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
