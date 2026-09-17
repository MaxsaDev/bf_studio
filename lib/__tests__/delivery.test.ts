import { describe, it, expect } from "vitest";
import {
  deliveryLabel,
  deliveryOptionConfig,
  deliverySchema,
  describeDelivery,
  enabledDeliveryMethods,
  shortWarehouseLabel,
  withDeliveryDescription,
} from "../delivery";
import { MAX_ORDER_DESCRIPTION_LENGTH } from "../cart";
import type { NovaPoshtaDelivery } from "@/types/delivery";

const np: NovaPoshtaDelivery = {
  method: "nova_poshta",
  recipient: { name: "Олена Петренко", phone: "+380969189089" },
  city: { ref: "db5c88f5-391c-11dd-90d9-001a92567626", name: "Львів", present: "м. Львів, Львівська обл." },
  warehouse: {
    ref: "1ec09d34-e1c2-11e3-8c4a-0050568002cf",
    description: "Відділення №5 (до 30 кг): вул. Шевченка, 60",
    category: "Branch",
  },
};

describe("deliverySchema", () => {
  it("accepts pickup, electronic and a full Nova Poshta delivery", () => {
    expect(deliverySchema.safeParse({ method: "pickup" }).success).toBe(true);
    expect(deliverySchema.safeParse({ method: "electronic" }).success).toBe(true);
    expect(deliverySchema.safeParse(np).success).toBe(true);
  });

  it("keeps an electronic delivery free of recipient data", () => {
    const parsed = deliverySchema.parse({ method: "electronic", recipient: np.recipient });
    expect(parsed).toEqual({ method: "electronic" });
  });

  it("rejects a one-word recipient, a display-format phone and non-UUID refs", () => {
    expect(deliverySchema.safeParse({ ...np, recipient: { ...np.recipient, name: "Олена" } }).success).toBe(false);
    expect(
      deliverySchema.safeParse({ ...np, recipient: { ...np.recipient, phone: "+38 (096) 918-90-89" } }).success
    ).toBe(false);
    expect(deliverySchema.safeParse({ ...np, city: { ...np.city, ref: "lviv" } }).success).toBe(false);
    expect(deliverySchema.safeParse({ ...np, warehouse: { ...np.warehouse, category: "Door" } }).success).toBe(false);
    expect(deliverySchema.safeParse({ method: "courier" }).success).toBe(false);
  });
});

describe("helpers", () => {
  it("lists the enabled methods with pickup first (the default)", () => {
    expect(enabledDeliveryMethods()).toEqual(["pickup", "nova_poshta", "electronic"]);
  });

  it("reads labels and notes from site-config", () => {
    expect(deliveryLabel("pickup")).toBe("Забрати в студії");
    expect(deliveryLabel("nova_poshta")).toBe("Нова пошта");
    expect(deliveryLabel("electronic")).toBe("Електронний");
    expect(deliveryOptionConfig("electronic").note).toContain("найближчим часом");
  });

  it("shortens warehouse descriptions", () => {
    expect(shortWarehouseLabel("Відділення №5 (до 30 кг): вул. Шевченка, 60", "Branch")).toBe("Відділення №5");
    expect(shortWarehouseLabel("Поштомат №10001: вул. Личаківська, 12", "Postomat")).toBe("Поштомат №10001");
    expect(shortWarehouseLabel("Відділення без номера", "Branch")).toBe("Відділення");
  });
});

describe("descriptions", () => {
  it("describes every method for the admin", () => {
    expect(describeDelivery({ method: "pickup" })).toBe("Самовивіз зі студії");
    expect(describeDelivery({ method: "electronic" })).toBe("Електронна BFCard");
    expect(describeDelivery(np)).toBe("Нова пошта: Львів, Відділення №5, Олена Петренко +380969189089");
  });

  it("appends the delivery and cuts the items to stay within the cap", () => {
    const items = "Курс (10 сеансів) - Корекція фігури Основна";
    expect(withDeliveryDescription(items, { method: "pickup" })).toBe(
      "Курс (10 сеансів) - Корекція фігури Основна. Доставка: Самовивіз зі студії"
    );
    expect(withDeliveryDescription(items, undefined)).toBe(items);

    const long = "Х".repeat(400);
    const result = withDeliveryDescription(long, np);
    expect(result.length).toBeLessThanOrEqual(MAX_ORDER_DESCRIPTION_LENGTH);
    expect(result.endsWith(describeDelivery(np))).toBe(true);
    expect(result).toContain("…");
  });
});
