import { describe, it, expect, afterEach } from "vitest";
import {
  applyDiscount,
  resolvePrice,
  formatDiscountEndDate,
} from "../pricing";
import {
  MassageCourseCertificate,
  GiftCertificate,
  MasterClassCertificate,
  NamedGiftCertificate,
  SpecialCertificate,
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
  const originalTz = process.env.TZ;
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it("formats a valid date", () => {
    expect(formatDiscountEndDate("2026-03-23")).toBe("до 23.03");
  });

  it("keeps the calendar date in a negative-offset timezone", () => {
    // Before the fix this rendered "до 22.03" (UTC midnight → previous local day)
    process.env.TZ = "America/New_York";
    expect(formatDiscountEndDate("2026-03-23")).toBe("до 23.03");
    expect(formatDiscountEndDate("2026-01-01")).toBe("до 01.01");
  });

  it("keeps the calendar date in a positive-offset timezone", () => {
    process.env.TZ = "Pacific/Auckland";
    expect(formatDiscountEndDate("2026-03-23")).toBe("до 23.03");
  });

  it("returns null for garbage and rolled-over parts", () => {
    expect(formatDiscountEndDate("not-a-date")).toBeNull();
    expect(formatDiscountEndDate("2026-13-45")).toBeNull();
    expect(formatDiscountEndDate("2026-02-30")).toBeNull();
  });
});

describe("resolvePrice — remaining certificate types", () => {
  const special: SpecialCertificate = {
    id: 3,
    type: "special",
    title: "Масаж для двох",
    description: "Сеанс парного масажу",
    price: 3300,
  };

  const named: NamedGiftCertificate = {
    id: 14,
    type: "named_gift_certificate",
    denomination: 2000,
    title: "Рубіновий",
    description: "Послуги масажу 2000 грн",
    discount: { percentage: 10, label: "Свято" },
  };

  it("uses price and title for special certificates", () => {
    const resolved = resolvePrice(special);
    expect(resolved.basePrice).toBe(3300);
    expect(resolved.finalPrice).toBe(3300);
    expect(resolved.itemTitle).toBe("Масаж для двох");
    expect(resolved.description).toBe("Сеанс парного масажу");
    expect(resolved.variantTitle).toBeUndefined();
  });

  it("uses denomination with certificate-level discount for named certificates", () => {
    const resolved = resolvePrice(named, "ignored-variant-id");
    expect(resolved.basePrice).toBe(2000);
    expect(resolved.finalPrice).toBe(1800);
    expect(resolved.discount?.label).toBe("Свято");
    expect(resolved.itemTitle).toBe("Рубіновий");
  });

  it("lets a variant discount override the certificate discount for courses", () => {
    const discountedCourse: MassageCourseCertificate = {
      ...course,
      discount: { percentage: 50 },
    };
    // variant "basic" has its own 5% → wins over the certificate's 50%
    expect(resolvePrice(discountedCourse, "basic").finalPrice).toBe(13300);
    // variant "session" has none → inherits the certificate's 50%
    expect(resolvePrice(discountedCourse, "session").finalPrice).toBe(700);
  });
});
