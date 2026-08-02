import { describe, it, expect } from "vitest";
import {
  applyDiscount,
  resolvePrice,
  formatDiscountEndDate,
} from "../pricing";
import {
  MassageCourseCertificate,
  GiftCertificate,
  MasterClassCertificate,
} from "@/types/certificate";

const course: MassageCourseCertificate = {
  id: 1,
  type: "massage_course",
  title: "Корекція фігури",
  description: "Корекція фігури Основна",
  variants: [
    { id: "session", label: "1 Сеанс", title: "1 сеанс з курсу", price: 1400, sessions: 1 },
    {
      id: "basic",
      label: "10 Сеансів",
      title: "Курс (10 сеансів)",
      price: 14000,
      sessions: 10,
      discount: { percentage: 5 },
    },
  ],
};

const gift: GiftCertificate = {
  id: 9,
  type: "gift_certificate",
  denomination: 500,
  description: "Послуги масажу 500 грн",
};

const masterClass: MasterClassCertificate = {
  id: 17,
  type: "master_class",
  title: "Класичний масаж",
  description: "Майстер-клас з техніки класичного масажу",
  price: 3750,
};

describe("applyDiscount", () => {
  it("returns price unchanged without discount", () => {
    expect(applyDiscount(1000)).toBe(1000);
  });

  it("applies percentage and rounds", () => {
    expect(applyDiscount(14000, { percentage: 5 })).toBe(13300);
    expect(applyDiscount(999, { percentage: 10 })).toBe(899);
  });
});

describe("resolvePrice", () => {
  it("resolves course variant by id with variant discount", () => {
    const resolved = resolvePrice(course, "basic");
    expect(resolved.basePrice).toBe(14000);
    expect(resolved.finalPrice).toBe(13300);
    expect(resolved.variantTitle).toBe("10 сеансів");
    expect(resolved.description).toBe(
      "Курс (10 сеансів) - Корекція фігури Основна"
    );
  });

  it("falls back to first variant for unknown id", () => {
    const resolved = resolvePrice(course, "nonexistent");
    expect(resolved.basePrice).toBe(1400);
    expect(resolved.variantTitle).toBe("1 сеанс");
  });

  it("uses denomination as price for gift certificates", () => {
    const resolved = resolvePrice(gift);
    expect(resolved.basePrice).toBe(500);
    expect(resolved.finalPrice).toBe(500);
    expect(resolved.itemTitle).toBe("Сертифікат на 500 ₴");
  });

  it("uses price for master classes", () => {
    const resolved = resolvePrice(masterClass);
    expect(resolved.finalPrice).toBe(3750);
    expect(resolved.itemTitle).toBe("Класичний масаж");
  });
});

describe("formatDiscountEndDate", () => {
  it("formats a valid date", () => {
    expect(formatDiscountEndDate("2026-03-23")).toBe("до 23.03");
  });

  it("returns null for garbage", () => {
    expect(formatDiscountEndDate("not-a-date")).toBeNull();
  });
});
