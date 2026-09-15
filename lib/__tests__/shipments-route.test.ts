import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/shipments/route";

/**
 * The route only relays the order's client token to the payments service,
 * which owns the payment record and the Nova Poshta waybill. `fetch` is
 * stubbed per test.
 */

const fetchMock = vi.fn();
const TOKEN = "a".repeat(48);
let ip = 0;

function request(body: unknown) {
  ip += 1;
  return new NextRequest("http://localhost/api/shipments", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.9.${Math.floor(ip / 250)}.${ip % 250}` },
    body: JSON.stringify(body),
  });
}

function upstream(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

const waybill = { number: "20450000000001", estimatedDeliveryDate: "17.09.2026", mock: false };
const delivery = {
  method: "nova_poshta",
  recipientName: "Олена Петренко",
  cityName: "м. Львів, Львівська обл.",
  warehouseDescription: "Відділення №5 (до 30 кг): вул. Шевченка, 60",
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("PAYMENT_SERVICE_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /api/shipments", () => {
  it("refuses without the service API key", async () => {
    vi.stubEnv("PAYMENT_SERVICE_API_KEY", "");
    const res = await POST(request({ orderReference: "o1", clientToken: TOKEN }));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates the body before calling the service", async () => {
    expect((await POST(request({ orderReference: "o1" }))).status).toBe(400);
    expect((await POST(request({ orderReference: "o1", clientToken: "short" }))).status).toBe(400);
    expect((await POST(request({ orderReference: "o1", token: TOKEN }))).status).toBe(400); // old field name
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the client token to the service and returns the waybill", async () => {
    fetchMock.mockResolvedValueOnce(
      upstream(200, { success: true, data: { status: "created", waybill, delivery } })
    );

    const res = await POST(request({ orderReference: "cart_2_3_777", clientToken: TOKEN }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "created",
      waybill,
      delivery: {
        recipientName: "Олена Петренко",
        cityName: "м. Львів, Львівська обл.",
        warehouseDescription: "Відділення №5 (до 30 кг): вул. Шевченка, 60",
      },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://bf-club-delta.vercel.app/api/v1/certificates/orders/cart_2_3_777/shipment");
    expect(init.method).toBe("POST");
    expect(init.headers["x-api-key"]).toBe("test-key");
    expect(JSON.parse(init.body)).toEqual({ clientToken: TOKEN });
  });

  it("returns an existing waybill as 'exists'", async () => {
    fetchMock.mockResolvedValueOnce(
      upstream(200, { success: true, data: { status: "exists", waybill, delivery } })
    );
    const res = await POST(request({ orderReference: "cart_2_3_777", clientToken: TOKEN }));
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("exists");
  });

  it("answers 202 pending while the service has not confirmed the payment", async () => {
    fetchMock.mockResolvedValueOnce(
      upstream(202, { success: true, data: { status: "pending", paymentStatus: "created" } })
    );
    const res = await POST(request({ orderReference: "o2", clientToken: TOKEN }));
    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toEqual({ status: "pending", paymentStatus: "created" });
  });

  it("reports pickup orders as failed so the browser drops its entry", async () => {
    fetchMock.mockResolvedValueOnce(
      upstream(200, { success: true, data: { status: "not_applicable", delivery: { method: "pickup" } } })
    );
    const res = await POST(request({ orderReference: "o3", clientToken: TOKEN }));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ status: "failed", paymentStatus: "not_applicable" });
  });

  it("passes token and order errors through as 4xx", async () => {
    fetchMock.mockResolvedValueOnce(upstream(401, { success: false, error: { message: "Wrong client token" } }));
    expect((await POST(request({ orderReference: "o4", clientToken: TOKEN }))).status).toBe(401);

    fetchMock.mockResolvedValueOnce(upstream(404, { success: false, error: { message: "Unknown order" } }));
    expect((await POST(request({ orderReference: "o5", clientToken: TOKEN }))).status).toBe(404);
  });

  it("maps service failures to 502 / 503 so the browser retries later", async () => {
    fetchMock.mockResolvedValueOnce(upstream(502, { success: false, error: { message: "NP failed" } }));
    const failed = await POST(request({ orderReference: "o6", clientToken: TOKEN }));
    expect(failed.status).toBe(502);
    expect((await failed.json()).error.message).toContain("вручну");

    fetchMock.mockResolvedValueOnce(upstream(503, { success: false, error: { message: "not configured" } }));
    expect((await POST(request({ orderReference: "o7", clientToken: TOKEN }))).status).toBe(503);

    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    expect((await POST(request({ orderReference: "o8", clientToken: TOKEN }))).status).toBe(502);
  });
});
