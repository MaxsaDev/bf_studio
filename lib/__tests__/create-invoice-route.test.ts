import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/create-invoice/route";

/**
 * `fetch` is stubbed for every test - nothing here ever reaches bf-back-v2
 * or WayForPay. `.env.local` is not loaded by vitest, so the API key is set
 * explicitly per test. The route talks to the service's certificate order
 * endpoint, which stores the order and answers with the invoice URL.
 */

const fetchMock = vi.fn();
let ipCounter = 0;

function makeRequest(
  body: unknown,
  { ip, raw = false }: { ip?: string; raw?: boolean } = {}
) {
  ipCounter += 1;
  return new NextRequest("http://localhost/api/create-invoice", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Distinct IP per request so tests don't trip each other's rate limit
      "x-forwarded-for": ip ?? `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`,
    },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

const CLIENT_TOKEN = "c".repeat(48);

function upstreamOk(invoiceUrl = "https://secure.wayforpay.com/page?vpath=abc") {
  return new Response(
    JSON.stringify({
      success: true,
      data: { invoiceUrl, orderReference: "cert_1_basic_1_2", clientToken: CLIENT_TOKEN },
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

const buyer = {
  name: "Олена Іваненко",
  phone: "+380969189089",
  delivery: { method: "pickup" as const },
};
const npDelivery = {
  method: "nova_poshta" as const,
  recipient: { name: "Олена Петренко", phone: "+380501234567" },
  city: { ref: "db5c88f5-391c-11dd-90d9-001a92567626", name: "Львів", present: "м. Львів, Львівська обл." },
  warehouse: {
    ref: "1ec09d34-e1c2-11e3-8c4a-0050568002cf",
    description: "Відділення №5 (до 30 кг): вул. Шевченка, 60",
    category: "Branch" as const,
  },
};
const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("PAYMENT_SERVICE_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /api/create-invoice - validation", () => {
  it("rejects a non-JSON body", async () => {
    const res = await POST(makeRequest("not json", { raw: true }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects missing fields and an empty cart", async () => {
    expect((await POST(makeRequest({ items: [{ certificateId: 3 }], name: "Олена" }))).status).toBe(400);
    expect((await POST(makeRequest({ items: [], ...buyer }))).status).toBe(400);
    expect((await POST(makeRequest({ certificateId: 3, ...buyer }))).status).toBe(400); // old single-item shape
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a phone that is not in +380XXXXXXXXX form", async () => {
    const res = await POST(
      makeRequest({ items: [{ certificateId: 3 }], name: "Олена", phone: "+38 (096) 918-90-89" })
    );
    expect(res.status).toBe(400);
  });

  it("rejects a name shorter than two characters", async () => {
    const res = await POST(makeRequest({ items: [{ certificateId: 3 }], name: " O ", phone: buyer.phone }));
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown certificate anywhere in the cart", async () => {
    const res = await POST(
      makeRequest({ items: [{ certificateId: 3 }, { certificateId: 9999 }], ...buyer })
    );
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a course without a valid variant instead of falling back to another price", async () => {
    expect((await POST(makeRequest({ items: [{ certificateId: 1 }], ...buyer }))).status).toBe(400);
    expect(
      (await POST(makeRequest({ items: [{ certificateId: 1, variantId: "does-not-exist" }], ...buyer }))).status
    ).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects quantities outside 1..10 and more than 10 lines", async () => {
    expect((await POST(makeRequest({ items: [{ certificateId: 3, qty: 0 }], ...buyer }))).status).toBe(400);
    expect((await POST(makeRequest({ items: [{ certificateId: 3, qty: 11 }], ...buyer }))).status).toBe(400);
    const tooMany = Array.from({ length: 11 }, (_, i) => ({ certificateId: 9 + (i % 5) }));
    expect((await POST(makeRequest({ items: tooMany, ...buyer }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when the API key is not configured", async () => {
    vi.stubEnv("PAYMENT_SERVICE_API_KEY", "");
    const res = await POST(makeRequest({ items: [{ certificateId: 3 }], ...buyer }));
    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/create-invoice - price resolution", () => {
  it("ignores any client-supplied amount and resolves the course variant price server-side", async () => {
    fetchMock.mockResolvedValueOnce(upstreamOk());

    const res = await POST(
      makeRequest({
        items: [{ certificateId: 1, variantId: "basic", amount: 1, price: 1 }],
        // Tampering attempts - must have no effect
        amount: 1,
        orderDescription: "hacked",
        merchant: "club",
        ...buyer,
      })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      url: "https://secure.wayforpay.com/page?vpath=abc",
      orderReference: "cert_1_basic_1_2",
      clientToken: CLIENT_TOKEN,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://bf-club-delta.vercel.app/api/v1/certificates/orders");
    expect(init.method).toBe("POST");
    expect(init.headers["x-api-key"]).toBe("test-key");

    const sent = sentBody();
    expect(sent.amount).toBe(13300); // 14000 − 5%
    expect(sent.orderDescription).toBe(
      "Курс (10 сеансів) - Корекція фігури Основна. Доставка: Самовивіз зі студії"
    );
    expect(sent.name).toBe(buyer.name);
    expect(sent.phone).toBe(buyer.phone);
    expect(sent.userId).toMatch(/^cert_1_basic_\d+$/);
    expect(sent.delivery).toEqual({ method: "pickup" });
    // Priced snapshot for the service's order record - catalog prices, not the request's
    expect(sent.items).toEqual([
      expect.objectContaining({
        certificateId: 1,
        variantId: "basic",
        qty: 1,
        variantTitle: "10 сеансів",
        unitPrice: 13300,
        lineTotal: 13300,
        addons: [],
      }),
    ]);
    expect(sent.items[0].title).toBeTruthy();
    // The service decides merchant and regularity for certificate orders
    expect(sent.merchant).toBeUndefined();
    expect(sent.regular).toBeUndefined();
  });

  it("uses the flat price for non-course certificates and ignores variantId", async () => {
    fetchMock.mockResolvedValueOnce(upstreamOk());
    const res = await POST(makeRequest({ items: [{ certificateId: 3, variantId: "basic" }], ...buyer }));
    expect(res.status).toBe(200);
    const sent = sentBody();
    expect(sent.amount).toBe(3300);
    expect(sent.orderDescription).toContain("парного масажу");
    expect(sent.userId).toMatch(/^cert_3_main_\d+$/);
  });

  it("multiplies by quantity and sums several lines", async () => {
    fetchMock.mockResolvedValueOnce(upstreamOk());
    const res = await POST(
      makeRequest({
        items: [
          { certificateId: 9, qty: 3 }, // 3 × 500
          { certificateId: 1, variantId: "basic" }, // 13300
          { certificateId: 17, qty: 2 }, // 2 × 3750
        ],
        ...buyer,
      })
    );
    expect(res.status).toBe(200);
    const sent = sentBody();
    expect(sent.amount).toBe(1500 + 13300 + 7500);
    expect(sent.orderDescription).toBe(
      "3 шт Послуги масажу 500 грн; Курс (10 сеансів) - Корекція фігури Основна; 2 шт Майстер-клас з техніки класичного масажу. Доставка: Самовивіз зі студії"
    );
    expect(sent.userId).toMatch(/^cart_3_6_\d+$/);
    expect(sent.items.map((i: { certificateId: number; qty: number; unitPrice: number; lineTotal: number }) => [i.certificateId, i.qty, i.unitPrice, i.lineTotal])).toEqual([
      [9, 3, 500, 1500],
      [1, 1, 13300, 13300],
      [17, 2, 3750, 7500],
    ]);
  });
});

describe("POST /api/create-invoice - add-ons", () => {
  it("prices add-ons server-side per card and appends them to the description", async () => {
    fetchMock.mockResolvedValueOnce(upstreamOk());
    const res = await POST(
      makeRequest({
        items: [
          {
            certificateId: 1,
            variantId: "basic",
            addons: [
              { id: "foot_massage", qty: 2 },
              { id: "aroma_oils", qty: 1 },
            ],
          },
        ],
        ...buyer,
      })
    );
    expect(res.status).toBe(200);
    const sent = sentBody();
    expect(sent.amount).toBe(14200); // 13300 + 2×400 + 100
    expect(sent.orderDescription).toBe(
      "Курс (10 сеансів) - Корекція фігури Основна. Додатки: Масаж стоп 2 шт, Ефірні олії. Доставка: Самовивіз зі студії"
    );
  });

  it("keeps add-ons per card when the same product is bought twice with different stickers", async () => {
    fetchMock.mockResolvedValueOnce(upstreamOk());
    const res = await POST(
      makeRequest({
        items: [
          { certificateId: 9, addons: [{ id: "candles", qty: 1 }], qty: 2 }, // 2 × (500 + 125)
          { certificateId: 9, addons: [{ id: "extra_time", qty: 1 }] }, // 500 + 750
        ],
        ...buyer,
      })
    );
    expect(res.status).toBe(200);
    const sent = sentBody();
    expect(sent.amount).toBe(1250 + 1250);
    expect(sent.orderDescription).toBe(
      "2 шт Послуги масажу 500 грн (Додатки: Композиція свічок); Послуги масажу 500 грн (Додатки: Збільшення часу сеансу). Доставка: Самовивіз зі студії"
    );
  });

  it("rejects an add-on the product does not offer", async () => {
    // Загальний оздоровчий 90 хв: no body-part add-ons
    const res = await POST(
      makeRequest({ items: [{ certificateId: 22, addons: [{ id: "foot_massage", qty: 1 }] }], ...buyer })
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a quantity above the product limit", async () => {
    // Gift card: single toggle only
    const res = await POST(
      makeRequest({ items: [{ certificateId: 9, addons: [{ id: "candles", qty: 2 }] }], ...buyer })
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unknown ids, zero quantities and duplicates", async () => {
    for (const addonsBody of [
      [{ id: "hot_stones", qty: 1 }],
      [{ id: "candles", qty: 0 }],
      [{ id: "candles", qty: 99 }],
      [
        { id: "candles", qty: 1 },
        { id: "candles", qty: 1 },
      ],
    ]) {
      const res = await POST(makeRequest({ items: [{ certificateId: 9, addons: addonsBody }], ...buyer }));
      expect(res.status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects add-ons for a master class", async () => {
    const res = await POST(
      makeRequest({ items: [{ certificateId: 17, addons: [{ id: "candles", qty: 1 }] }], ...buyer })
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/create-invoice - delivery", () => {
  it("requires a delivery choice while the site offers one", async () => {
    const res = await POST(
      makeRequest({ items: [{ certificateId: 3 }], name: buyer.name, phone: buyer.phone })
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("appends the pickup choice to the description", async () => {
    fetchMock.mockResolvedValueOnce(upstreamOk());
    await POST(makeRequest({ items: [{ certificateId: 3 }], ...buyer }));
    expect(sentBody().orderDescription).toBe(
      "Сеанс парного масажу для 2 осіб на вибір: загальний оздоровчий, лімфодренажний, м'язове відновлення або розслабляючий масаж — при світлі свічок. Доставка: Самовивіз зі студії"
    );
  });

  it("forwards the electronic choice and names it in the description", async () => {
    fetchMock.mockResolvedValueOnce(upstreamOk());
    const res = await POST(
      makeRequest({ items: [{ certificateId: 9 }], name: buyer.name, phone: buyer.phone, delivery: { method: "electronic" } })
    );
    expect(res.status).toBe(200);
    const sent = sentBody();
    expect(sent.delivery).toEqual({ method: "electronic" });
    expect(sent.orderDescription).toBe("Послуги масажу 500 грн. Доставка: Електронна BFCard");
  });

  it("forwards the Nova Poshta block to the service and passes the order's client token back", async () => {
    fetchMock.mockResolvedValueOnce(upstreamOk());
    const res = await POST(
      makeRequest({ items: [{ certificateId: 9, qty: 2 }], name: buyer.name, phone: buyer.phone, delivery: npDelivery })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orderReference).toBe("cert_1_basic_1_2");
    expect(body.clientToken).toBe(CLIENT_TOKEN);
    const sent = sentBody();
    expect(sent.delivery).toEqual(npDelivery);
    expect(sent.orderDescription).toBe(
      "2 шт Послуги масажу 500 грн. Доставка: Нова пошта: Львів, Відділення №5, Олена Петренко +380501234567"
    );
  });

  it("omits the client token when the service sends none", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: true, data: { invoiceUrl: "https://w4p/x", orderReference: "cert_9_main_1" } }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    const res = await POST(makeRequest({ items: [{ certificateId: 9 }], ...buyer }));
    expect(res.status).toBe(200);
    expect((await res.json()).clientToken).toBeUndefined();
  });

  it("rejects malformed Nova Poshta details", async () => {
    const res = await POST(
      makeRequest({
        items: [{ certificateId: 9 }],
        name: buyer.name,
        phone: buyer.phone,
        delivery: { ...npDelivery, warehouse: { ...npDelivery.warehouse, ref: "branch-5" } },
      })
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/create-invoice - upstream failures", () => {
  it("maps a service-level failure to an error message", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, error: { message: "Payment failed" } }),
        { status: 400, headers: { "content-type": "application/json" } }
      )
    );
    const res = await POST(makeRequest({ items: [{ certificateId: 3 }], ...buyer }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: { message: "Payment failed" } });
  });

  it("returns 502 when the service answers 200 without an invoice URL", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    const res = await POST(makeRequest({ items: [{ certificateId: 3 }], ...buyer }));
    expect(res.status).toBe(502);
  });

  it("returns 502 with a generic message when the service is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const res = await POST(makeRequest({ items: [{ certificateId: 3 }], ...buyer }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error.message).toContain("Спробуйте ще раз");
  });
});

describe("POST /api/create-invoice - rate limiting", () => {
  it("blocks the 11th request from one IP within a minute and never reaches upstream", async () => {
    const ip = "203.0.113.7";
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      // Invalid bodies on purpose: they still count against the limit
      const res = await POST(makeRequest({}, { ip }));
      statuses.push(res.status);
      if (res.status === 429) {
        expect(res.headers.get("Retry-After")).toMatch(/^\d+$/);
      }
    }
    expect(statuses.slice(0, 10).every((s) => s === 400)).toBe(true);
    expect(statuses[10]).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
