import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callService, serviceApiBase } from "../payment-service";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("PAYMENT_SERVICE_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("serviceApiBase", () => {
  it("defaults to the production service", () => {
    vi.stubEnv("PAYMENT_SERVICE_URL", "");
    expect(serviceApiBase()).toBe("https://bf-club-delta.vercel.app/api/v1");
  });

  it("accepts the older /payments URL and trailing slashes", () => {
    vi.stubEnv("PAYMENT_SERVICE_URL", "http://localhost:3001/api/v1/payments");
    expect(serviceApiBase()).toBe("http://localhost:3001/api/v1");
    vi.stubEnv("PAYMENT_SERVICE_URL", "http://localhost:3001/api/v1/");
    expect(serviceApiBase()).toBe("http://localhost:3001/api/v1");
  });
});

describe("callService", () => {
  it("sends the API key, JSON body and query, and parses the envelope", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { ok: 1 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    const result = await callService("/delivery/cities", { query: { q: "Льв", empty: "" } });
    expect(result).toEqual({
      status: 200,
      ok: true,
      body: { success: true, data: { ok: 1 } },
      retryAfter: null,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://bf-club-delta.vercel.app/api/v1/delivery/cities?q=%D0%9B%D1%8C%D0%B2");
    expect(init.method).toBe("GET");
    expect(init.headers["x-api-key"]).toBe("test-key");
    expect(init.body).toBeUndefined();

    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    await callService("/certificates/orders", { method: "POST", body: { a: 1 } });
    const [, postInit] = fetchMock.mock.calls[1];
    expect(postInit.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(postInit.body)).toEqual({ a: 1 });
  });

  it("keeps HTTP errors (with Retry-After) and reports transport errors as status 0", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: { message: "slow down" } }), {
        status: 429,
        headers: { "content-type": "application/json", "Retry-After": "3" },
      })
    );
    const throttled = await callService("/delivery/cities", { query: { q: "К" } });
    expect(throttled.status).toBe(429);
    expect(throttled.ok).toBe(false);
    expect(throttled.retryAfter).toBe("3");
    expect(throttled.body?.error?.message).toBe("slow down");

    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const down = await callService("/delivery/cities");
    expect(down).toEqual({ status: 0, ok: false, body: null, retryAfter: null });
  });

  it("throws when the API key is missing", async () => {
    vi.stubEnv("PAYMENT_SERVICE_API_KEY", "");
    await expect(callService("/x")).rejects.toThrow(/PAYMENT_SERVICE_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
