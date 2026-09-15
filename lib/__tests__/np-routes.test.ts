import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getCities } from "@/app/api/np/cities/route";
import { GET as getWarehouses } from "@/app/api/np/warehouses/route";

/**
 * Both proxies forward to the payments service; `fetch` is stubbed so no
 * request leaves the test. The service holds the Nova Poshta key.
 */

const fetchMock = vi.fn();
const LVIV = "db5c88f5-391c-11dd-90d9-001a92567626";
let ip = 0;

function get(path: string) {
  ip += 1;
  return new NextRequest(`http://localhost${path}`, {
    headers: { "x-forwarded-for": `10.8.${Math.floor(ip / 250)}.${ip % 250}` },
  });
}

function upstream(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("PAYMENT_SERVICE_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Nova Poshta lookup proxies", () => {
  it("answer 503 without the service API key and never call out", async () => {
    vi.stubEnv("PAYMENT_SERVICE_API_KEY", "");
    expect((await getCities(get("/api/np/cities?q=Льв"))).status).toBe(503);
    expect((await getWarehouses(get(`/api/np/warehouses?cityRef=${LVIV}`))).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validate the query before calling the service", async () => {
    expect((await getCities(get("/api/np/cities?q=Л"))).status).toBe(400);
    expect((await getWarehouses(get("/api/np/warehouses?cityRef=lviv"))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forward cities from the service with the API key and cache headers", async () => {
    fetchMock.mockResolvedValueOnce(
      upstream(200, {
        success: true,
        data: {
          cities: [
            { ref: "r1", cityRef: LVIV, present: "м. Львів, Львівська обл.", name: "Львів", area: "Львівська", region: "", warehouses: 3729 },
          ],
        },
      })
    );

    const res = await getCities(get("/api/np/cities?q=%D0%BB%D1%8C%D0%B2"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("max-age");
    const body = await res.json();
    expect(body).toEqual({
      cities: [expect.objectContaining({ name: "Львів", cityRef: LVIV })],
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://bf-club-delta.vercel.app/api/v1/delivery/cities?q=%D0%BB%D1%8C%D0%B2");
    expect(init.headers["x-api-key"]).toBe("test-key");
  });

  it("forward warehouses with the optional filter", async () => {
    fetchMock.mockResolvedValueOnce(
      upstream(200, {
        success: true,
        data: {
          warehouses: [
            { ref: "w1", number: "10001", description: "Поштомат №10001: вул. Личаківська, 12", shortAddress: "", category: "Postomat", maxWeightKg: 30, cityRef: LVIV },
          ],
        },
      })
    );

    const res = await getWarehouses(get(`/api/np/warehouses?cityRef=${LVIV}&q=%D0%BF%D0%BE%D1%88%D1%82`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.warehouses).toHaveLength(1);
    expect(body.warehouses[0].category).toBe("Postomat");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://bf-club-delta.vercel.app/api/v1/delivery/warehouses?cityRef=${LVIV}&q=%D0%BF%D0%BE%D1%88%D1%82`
    );
  });

  it("map service throttling to 429 with Retry-After, an outage to 503, other failures to 502", async () => {
    fetchMock.mockResolvedValueOnce(
      upstream(429, { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "throttled" } }, { "Retry-After": "3" })
    );
    const throttled = await getCities(get("/api/np/cities?q=%D0%9B%D1%8C%D0%B2"));
    expect(throttled.status).toBe(429);
    expect(throttled.headers.get("Retry-After")).toBe("3");

    fetchMock.mockResolvedValueOnce(upstream(503, { success: false, error: { message: "not configured" } }));
    expect((await getCities(get("/api/np/cities?q=%D0%9B%D1%8C%D0%B2"))).status).toBe(503);

    fetchMock.mockResolvedValueOnce(upstream(502, { success: false, error: { message: "np down" } }));
    expect((await getWarehouses(get(`/api/np/warehouses?cityRef=${LVIV}`))).status).toBe(502);

    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    expect((await getWarehouses(get(`/api/np/warehouses?cityRef=${LVIV}`))).status).toBe(502);
  });
});
