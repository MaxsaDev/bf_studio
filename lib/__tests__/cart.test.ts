import { describe, it, expect } from "vitest";
import {
  addToCart,
  CART_MAX_LINE_QTY,
  CART_MAX_LINES,
  describeCart,
  isSameProduct,
  MAX_ORDER_DESCRIPTION_LENGTH,
  normalizeAddons,
  removeFromCart,
  resolveCart,
  sanitizeCartLines,
  setCartLineQty,
  updateCartLineAddons,
} from "../cart";
import type { AddonSelection } from "@/types/addon";
import type { CartLine } from "@/types/cart";

const gift500 = { certificateId: 9, variantId: null, addons: [] };
const gift500Candles = {
  certificateId: 9,
  variantId: null,
  addons: [{ id: "candles" as const, qty: 1 }],
};
const course = { certificateId: 1, variantId: "basic", addons: [] };

describe("normalizeAddons / isSameProduct", () => {
  it("sorts by catalog order, drops zero quantities, last duplicate wins", () => {
    expect(
      normalizeAddons([
        { id: "extra_time", qty: 1 },
        { id: "foot_massage", qty: 0 },
        { id: "candles", qty: 2 },
        { id: "candles", qty: 3 },
      ])
    ).toEqual([
      { id: "candles", qty: 3 },
      { id: "extra_time", qty: 1 },
    ]);
  });

  it("treats the same add-ons in a different order as the same product", () => {
    const a = {
      certificateId: 1,
      variantId: "basic",
      addons: [
        { id: "candles" as const, qty: 2 },
        { id: "foot_massage" as const, qty: 1 },
      ],
    };
    const b = {
      certificateId: 1,
      variantId: "basic",
      addons: [
        { id: "foot_massage" as const, qty: 1 },
        { id: "candles" as const, qty: 2 },
      ],
    };
    expect(isSameProduct(a, b)).toBe(true);
    expect(isSameProduct(a, { ...b, addons: [{ id: "candles", qty: 1 }] })).toBe(false);
    expect(isSameProduct(course, { ...course, variantId: "session" })).toBe(false);
  });
});

describe("addToCart", () => {
  it("adds a line and merges an identical configuration into quantity", () => {
    let lines = addToCart([], gift500);
    lines = addToCart(lines, gift500);
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(2);
  });

  it("keeps the same product with different add-ons as separate lines", () => {
    const lines = addToCart(addToCart([], gift500), gift500Candles);
    expect(lines).toHaveLength(2);
  });

  it("caps quantity and the number of lines", () => {
    let lines = addToCart([], gift500, 99);
    expect(lines[0].qty).toBe(CART_MAX_LINE_QTY);

    lines = [];
    for (let i = 0; i < CART_MAX_LINES + 3; i++) {
      lines = addToCart(lines, { certificateId: 9, variantId: null, addons: [{ id: "extra_time", qty: 1 }] });
      lines = addToCart(lines, { certificateId: 9 + (i % 5), variantId: null, addons: [] });
    }
    expect(lines.length).toBeLessThanOrEqual(CART_MAX_LINES);
  });
});

describe("setCartLineQty / removeFromCart / updateCartLineAddons", () => {
  it("clamps quantity and removes at zero", () => {
    const [line] = addToCart([], gift500);
    expect(setCartLineQty([line], line.id, 4)[0].qty).toBe(4);
    expect(setCartLineQty([line], line.id, 50)[0].qty).toBe(CART_MAX_LINE_QTY);
    expect(setCartLineQty([line], line.id, 0)).toEqual([]);
    expect(removeFromCart([line], line.id)).toEqual([]);
  });

  it("replaces add-ons and merges into a now-identical twin", () => {
    let lines = addToCart(addToCart([], gift500), gift500Candles);
    const plain = lines.find((l) => l.addons.length === 0)!;
    lines = updateCartLineAddons(lines, plain.id, [{ id: "candles", qty: 1 }]);
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(2);
    expect(lines[0].addons).toEqual([{ id: "candles", qty: 1 }]);
  });
});

describe("resolveCart", () => {
  it("prices each line as qty × (discounted card + its add-ons)", () => {
    let lines = addToCart([], { ...course, addons: [{ id: "foot_massage", qty: 2 }] });
    lines = addToCart(lines, gift500Candles, 3);
    const cart = resolveCart(lines);
    expect(cart.lines).toHaveLength(2);
    expect(cart.lines[0].lineTotal).toBe(13300 + 800);
    expect(cart.lines[1].lineTotal).toBe(3 * (500 + 125));
    expect(cart.total).toBe(14100 + 1875);
    expect(cart.count).toBe(4);
  });

  it("drops lines the catalog no longer knows and clamps stray add-ons", () => {
    const lines: CartLine[] = [
      { id: "a", certificateId: 9999, variantId: null, addons: [], qty: 1 },
      { id: "b", certificateId: 1, variantId: "nope", addons: [], qty: 1 },
      { id: "c", certificateId: 9, variantId: null, addons: [{ id: "candles", qty: 5 }], qty: 1 },
      { id: "d", certificateId: 22, variantId: null, addons: [{ id: "foot_massage", qty: 1 }], qty: 1 },
    ];
    const cart = resolveCart(lines);
    expect(cart.lines.map((l) => l.line.id)).toEqual(["c", "d"]);
    expect(cart.lines[0].line.addons).toEqual([{ id: "candles", qty: 1 }]); // clamped to the limit
    expect(cart.lines[1].line.addons).toEqual([]); // not offered → dropped
    expect(cart.total).toBe(625 + 1900);
  });
});

describe("describeCart", () => {
  it("is the plain order description for a single card", () => {
    const cart = resolveCart(addToCart([], { ...course, addons: [{ id: "aroma_oils", qty: 1 }] }));
    expect(cart.description).toBe("Курс (10 сеансів) - Корекція фігури Основна. Додатки: Ефірні олії");
  });

  it("lists quantities and per-card add-ons for several cards", () => {
    let lines = addToCart([], gift500Candles, 2);
    lines = addToCart(lines, course);
    expect(resolveCart(lines).description).toBe(
      "2 шт Послуги масажу 500 грн (Додатки: Композиція свічок); Курс (10 сеансів) - Корекція фігури Основна"
    );
  });

  it("never exceeds the length cap", () => {
    const pool: AddonSelection[] = [
      { id: "foot_massage", qty: 1 },
      { id: "hand_massage", qty: 1 },
      { id: "head_massage", qty: 1 },
      { id: "extra_time", qty: 1 },
    ];
    let lines: CartLine[] = [];
    for (let i = 0; i < 10; i++) {
      lines = addToCart(lines, {
        certificateId: 9 + (i % 5),
        variantId: null,
        addons: pool.slice(0, 1 + (i % 4)),
      });
    }
    const description = describeCart(resolveCart(lines).lines);
    expect(description.length).toBeLessThanOrEqual(MAX_ORDER_DESCRIPTION_LENGTH);
    expect(description.endsWith("…")).toBe(true);
  });
});

describe("sanitizeCartLines", () => {
  it("accepts only well-formed lines the catalog knows", () => {
    const lines = sanitizeCartLines([
      null,
      "junk",
      { certificateId: "9" },
      { certificateId: 9999 },
      { id: "keep", certificateId: 9, variantId: 5, addons: [{ id: "candles", qty: 1 }, { bogus: true }], qty: 2.7 },
      { certificateId: 1, variantId: "basic", qty: 0 },
    ]);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ id: "keep", certificateId: 9, variantId: null, qty: 2, addons: [{ id: "candles", qty: 1 }] });
    expect(lines[1]).toMatchObject({ certificateId: 1, variantId: "basic", qty: 1 });
    expect(typeof lines[1].id).toBe("string");
  });

  it("returns an empty cart for non-arrays", () => {
    expect(sanitizeCartLines(null)).toEqual([]);
    expect(sanitizeCartLines({})).toEqual([]);
  });
});
