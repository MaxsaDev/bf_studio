import { describe, it, expect } from "vitest";
import { addons } from "@/data/addons";
import { resolveCart } from "@/lib/cart";
import { buildReceiptLines, receiptTotalKop } from "@/lib/receipt";
import type { AddonSelection } from "@/types/addon";
import type { CartLine } from "@/types/cart";

let n = 0;
function line(
  certificateId: number,
  opts: { variantId?: string | null; addons?: AddonSelection[]; qty?: number } = {}
): CartLine {
  n += 1;
  return {
    id: `l${n}`,
    certificateId,
    variantId: opts.variantId ?? null,
    addons: opts.addons ?? [],
    qty: opts.qty ?? 1,
  };
}

function receiptFor(lines: CartLine[]) {
  const cart = resolveCart(lines);
  const receipt = buildReceiptLines(cart);
  // The lines always add up to what the buyer pays
  expect(receiptTotalKop(receipt)).toBe(cart.total * 100);
  return receipt;
}

describe("buildReceiptLines", () => {
  it("prints a lone card under its catalog description at the discounted price", () => {
    expect(receiptFor([line(1, { variantId: "basic" })])).toEqual([
      { name: "Курс (10 сеансів) - Корекція фігури Основна", price: 13300, count: 1 },
    ]);
  });

  it("gives every add-on its own line under the fiscal name", () => {
    expect(
      receiptFor([line(9, { addons: [{ id: "aroma_oils", qty: 1 }] })])
    ).toEqual([
      { name: "Послуги масажу 500 грн", price: 500, count: 1 },
      { name: "Додаток до масажу «Ефірна олія»", price: 100, count: 1 },
    ]);
  });

  it("prints each card's add-ons right under that card, never merged across cards", () => {
    expect(
      receiptFor([
        line(1, { variantId: "basic", addons: [{ id: "foot_massage", qty: 2 }], qty: 3 }),
        line(9, { addons: [{ id: "foot_massage", qty: 1 }, { id: "candles", qty: 1 }] }),
        line(9, { addons: [{ id: "candles", qty: 1 }], qty: 2 }),
        line(17),
      ])
    ).toEqual([
      // 3 identical courses, 2 foot massages on each
      { name: "Курс (10 сеансів) - Корекція фігури Основна", price: 13300, count: 3 },
      { name: "Додаток до масажу «Масаж стоп»", price: 400, count: 6 },
      // Same product twice with different add-ons: two separate blocks
      { name: "Послуги масажу 500 грн", price: 500, count: 1 },
      { name: "Додаток до масажу «Масаж стоп»", price: 400, count: 1 },
      { name: "Додаток до масажу «Композиція свічок у кабінет»", price: 125, count: 1 },
      { name: "Послуги масажу 500 грн", price: 500, count: 2 },
      { name: "Додаток до масажу «Композиція свічок у кабінет»", price: 125, count: 2 },
      // No add-ons offered: the card alone
      { name: "Майстер-клас з техніки класичного масажу", price: 3750, count: 1 },
    ]);
  });

  it("never carries delivery or service text, and keeps names short enough for WayForPay", () => {
    const receipt = receiptFor([
      line(3, { addons: [{ id: "extra_time", qty: 1 }] }),
      line(1, { variantId: "basic", addons: addons.map((a) => ({ id: a.id, qty: 6 })) }),
    ]);
    for (const { name } of receipt) {
      expect(name).not.toMatch(/Доставка|Самовивіз|Нова пошта|Електронн/);
      expect(name.length).toBeLessThanOrEqual(250);
      // Characters that would break WayForPay's stitched callback JSON
      expect(name).not.toMatch(/["[\]&=+%\\]/);
    }
  });

  it("names every add-on as an add-on to a massage", () => {
    for (const addon of addons) {
      expect(addon.fiscalTitle).toMatch(/^Додаток до масажу «[^«»"]+»$/);
    }
  });
});
