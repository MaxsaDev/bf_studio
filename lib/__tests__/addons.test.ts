import { describe, it, expect } from "vitest";
import { certificates } from "@/data/certificates";
import { addons, ADDON_MAX_QTY } from "@/data/addons";
import {
  describeAddons,
  getAvailableAddons,
  resolveAddonLines,
  sumAddonLines,
  validateAddonSelection,
} from "../addons";
import { resolveOrder } from "../order";
import type { Certificate } from "@/types/certificate";

function cert(id: number): Certificate {
  const found = certificates.find((c) => c.id === id);
  if (!found) throw new Error(`No certificate ${id}`);
  return found;
}

const ids = (list: { addon: { id: string } }[]) => list.map((x) => x.addon.id);

describe("catalog", () => {
  it("has six add-ons with the sheet prices", () => {
    expect(addons.map((a) => [a.title, a.price])).toEqual([
      ["Масаж стоп", 400],
      ["Масаж долонь", 400],
      ["Масаж голови", 400],
      ["Ефірні олії", 100],
      ["Композиція свічок", 125],
      ["Збільшення часу сеансу", 750],
    ]);
  });
});

describe("getAvailableAddons — mirrors the bf-card-additions sheet", () => {
  it("gift and named certificates offer one of each", () => {
    for (const id of [9, 10, 11, 12, 13, 14, 15, 16]) {
      const available = getAvailableAddons(cert(id));
      expect(available).toHaveLength(6);
      expect(available.every((a) => a.maxQty === 1)).toBe(true);
    }
  });

  it("single sessions offer one of each, full courses up to six of each", () => {
    const session = getAvailableAddons(cert(1), "session");
    expect(session).toHaveLength(6);
    expect(session.every((a) => a.maxQty === 1)).toBe(true);

    const course = getAvailableAddons(cert(1), "basic");
    expect(course).toHaveLength(6);
    expect(course.every((a) => a.maxQty === ADDON_MAX_QTY)).toBe(true);
  });

  it("relaxing complex only offers head massage and extra time", () => {
    expect(ids(getAvailableAddons(cert(5), "session"))).toEqual(["head_massage", "extra_time"]);
    const course = getAvailableAddons(cert(5), "course");
    expect(ids(course)).toEqual(["head_massage", "extra_time"]);
    expect(course.every((a) => a.maxQty === 6)).toBe(true);
  });

  it("special sessions follow their rows", () => {
    expect(ids(getAvailableAddons(cert(3)))).not.toContain("candles"); // Масаж для двох
    expect(ids(getAvailableAddons(cert(25)))).not.toContain("foot_massage"); // Антистрес
    expect(ids(getAvailableAddons(cert(22)))).toEqual(["aroma_oils", "candles", "extra_time"]); // 90 хв
    expect(ids(getAvailableAddons(cert(23)))).toHaveLength(6); // Розслабляючий
    expect(ids(getAvailableAddons(cert(24)))).not.toContain("candles"); // Гарячим камінням
  });

  it("master classes offer nothing", () => {
    for (const id of [17, 18, 19, 20, 21]) {
      expect(getAvailableAddons(cert(id))).toEqual([]);
    }
  });

  it("an unknown course variant falls back to the certificate-level limits (none)", () => {
    expect(getAvailableAddons(cert(1), "nope")).toEqual([]);
  });
});

describe("validateAddonSelection — strict, for the payment route", () => {
  it("accepts a valid selection and returns priced lines in catalog order", () => {
    const result = validateAddonSelection(cert(1), "basic", [
      { id: "extra_time", qty: 1 },
      { id: "foot_massage", qty: 2 },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lines.map((l) => [l.addon.id, l.qty, l.total])).toEqual([
      ["foot_massage", 2, 800],
      ["extra_time", 1, 750],
    ]);
  });

  it("accepts an empty selection", () => {
    expect(validateAddonSelection(cert(17), null, [])).toEqual({ ok: true, lines: [] });
  });

  it("rejects an add-on the product does not offer", () => {
    const result = validateAddonSelection(cert(22), null, [{ id: "foot_massage", qty: 1 }]);
    expect(result.ok).toBe(false);
  });

  it("rejects quantities above the limit, below one, or fractional", () => {
    expect(validateAddonSelection(cert(9), null, [{ id: "candles", qty: 2 }]).ok).toBe(false);
    expect(validateAddonSelection(cert(1), "basic", [{ id: "candles", qty: 7 }]).ok).toBe(false);
    expect(validateAddonSelection(cert(1), "basic", [{ id: "candles", qty: 0 }]).ok).toBe(false);
    expect(validateAddonSelection(cert(1), "basic", [{ id: "candles", qty: 1.5 }]).ok).toBe(false);
  });

  it("rejects duplicates and unknown ids", () => {
    expect(
      validateAddonSelection(cert(9), null, [
        { id: "candles", qty: 1 },
        { id: "candles", qty: 1 },
      ]).ok
    ).toBe(false);
    expect(
      // @ts-expect-error — unknown id on purpose
      validateAddonSelection(cert(9), null, [{ id: "hot_stones", qty: 1 }]).ok
    ).toBe(false);
  });

  it("rejects anything for a master class", () => {
    expect(validateAddonSelection(cert(17), null, [{ id: "candles", qty: 1 }]).ok).toBe(false);
  });
});

describe("resolveAddonLines — lenient, for the UI", () => {
  it("clamps to the limit and drops what is not offered or zero", () => {
    const lines = resolveAddonLines(cert(1), "session", {
      foot_massage: 3, // clamped to 1
      candles: 0,
      head_massage: 1,
    });
    expect(lines.map((l) => [l.addon.id, l.qty])).toEqual([
      ["foot_massage", 1],
      ["head_massage", 1],
    ]);
  });

  it("keeps quantities for courses and prices them", () => {
    const lines = resolveAddonLines(cert(1), "basic", { candles: 4 });
    expect(lines).toHaveLength(1);
    expect(lines[0].total).toBe(500);
    expect(sumAddonLines(lines)).toBe(500);
  });

  it("returns nothing when the product offers nothing", () => {
    expect(resolveAddonLines(cert(17), null, { candles: 1 })).toEqual([]);
  });
});

describe("resolveOrder", () => {
  it("adds add-ons on top of the discounted main price", () => {
    const lines = resolveAddonLines(cert(1), "basic", { foot_massage: 2, aroma_oils: 1 });
    const order = resolveOrder(cert(1), "basic", lines);
    expect(order.finalPrice).toBe(13300); // 14000 - 5%
    expect(order.addonsTotal).toBe(900); // 2 × 400 + 100
    expect(order.total).toBe(14200);
    expect(order.orderDescription).toBe(
      "Курс (10 сеансів) - Корекція фігури Основна. Додатки: Масаж стоп 2 шт, Ефірні олії"
    );
  });

  it("never discounts add-ons", () => {
    const lines = resolveAddonLines(cert(1), "basic", { extra_time: 1 });
    expect(resolveOrder(cert(1), "basic", lines).addonsTotal).toBe(750);
  });

  it("is a plain price resolution without add-ons", () => {
    const order = resolveOrder(cert(3), null);
    expect(order.total).toBe(3300);
    expect(order.addonLines).toEqual([]);
    expect(order.orderDescription).toBe(cert(3).description);
  });
});

describe("describeAddons", () => {
  it("shows quantity only above one", () => {
    const lines = resolveAddonLines(cert(1), "basic", { foot_massage: 2, candles: 1 });
    expect(describeAddons(lines)).toBe("Масаж стоп 2 шт, Композиція свічок");
  });
});
