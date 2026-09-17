import { describe, it, expect } from "vitest";
import {
  checkoutFormDefaults,
  checkoutFormSchema,
  toDeliveryDetails,
  type CheckoutFormValues,
} from "@/components/checkout/checkout-form-schema";

const base: CheckoutFormValues = {
  ...checkoutFormDefaults(),
  name: "Олена Іваненко",
  phone: "+38 (096) 918-90-89",
  agreement: true,
};

const npValues: CheckoutFormValues = {
  ...base,
  deliveryMethod: "nova_poshta",
  recipientName: "Олена Петренко",
  recipientPhone: "+38 (050) 123-45-67",
  cityRef: "db5c88f5-391c-11dd-90d9-001a92567626",
  cityName: "Львів",
  cityPresent: "м. Львів, Львівська обл.",
  warehouseRef: "1ec09d34-e1c2-11e3-8c4a-0050568002cf",
  warehouseDescription: "Відділення №5 (до 30 кг): вул. Шевченка, 60",
  warehouseCategory: "Branch",
};

describe("checkout form", () => {
  it("preselects pickup", () => {
    expect(checkoutFormDefaults().deliveryMethod).toBe("pickup");
  });

  it("needs no recipient details for pickup and electronic", () => {
    expect(checkoutFormSchema.safeParse({ ...base, deliveryMethod: "pickup" }).success).toBe(true);
    expect(checkoutFormSchema.safeParse({ ...base, deliveryMethod: "electronic" }).success).toBe(true);
  });

  it("validates the Nova Poshta block only when it is chosen", () => {
    const result = checkoutFormSchema.safeParse({ ...base, deliveryMethod: "nova_poshta" });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path.join("."));
    expect(paths).toEqual(
      expect.arrayContaining(["recipientName", "recipientPhone", "cityName", "warehouseDescription"])
    );
    expect(checkoutFormSchema.safeParse(npValues).success).toBe(true);
  });

  it("maps every choice to the delivery object the payment route expects", () => {
    expect(toDeliveryDetails({ ...base, deliveryMethod: "pickup" })).toEqual({ method: "pickup" });
    expect(toDeliveryDetails({ ...base, deliveryMethod: "electronic" })).toEqual({ method: "electronic" });
    expect(toDeliveryDetails({ ...base, deliveryMethod: "none" })).toBeUndefined();
    // Leftover Nova Poshta input never leaks into an electronic order
    expect(toDeliveryDetails({ ...npValues, deliveryMethod: "electronic" })).toEqual({ method: "electronic" });
    expect(toDeliveryDetails(npValues)).toEqual({
      method: "nova_poshta",
      recipient: { name: "Олена Петренко", phone: "+380501234567" },
      city: { ref: npValues.cityRef, name: "Львів", present: "м. Львів, Львівська обл." },
      warehouse: { ref: npValues.warehouseRef, description: npValues.warehouseDescription, category: "Branch" },
    });
  });
});
