import * as z from "zod";
import { enabledDeliveryMethods, recipientNameSchema } from "@/lib/delivery";
import { formatPhoneForAPI, UA_PHONE_DISPLAY_REGEX } from "@/lib/phone";
import type { DeliveryDetails, DeliveryMethod } from "@/types/delivery";

/**
 * The payment-screen form: buyer, delivery, agreement. Nova Poshta fields
 * are only validated when that method is selected; city and warehouse must
 * be picked from the lookup lists (their refs are filled by the comboboxes).
 */

const PHONE_MESSAGE = "Введіть коректний номер телефону";

export const checkoutFormSchema = z
  .object({
    name: z.string().min(2, { message: "Ім'я повинно містити мінімум 2 символи" }),
    phone: z.string().regex(UA_PHONE_DISPLAY_REGEX, { message: PHONE_MESSAGE }),
    agreement: z.boolean().refine((val) => val === true, {
      message: "Необхідно погодитись з умовами",
    }),
    deliveryMethod: z.enum(["pickup", "nova_poshta", "none"]),
    recipientName: z.string(),
    recipientPhone: z.string(),
    cityRef: z.string(),
    cityName: z.string(),
    cityPresent: z.string(),
    warehouseRef: z.string(),
    warehouseDescription: z.string(),
    warehouseCategory: z.enum(["Branch", "Postomat", ""]),
  })
  .superRefine((values, ctx) => {
    if (values.deliveryMethod !== "nova_poshta") return;

    const name = recipientNameSchema.safeParse(values.recipientName);
    if (!name.success) {
      ctx.addIssue({
        code: "custom",
        path: ["recipientName"],
        message: "Вкажіть ім'я та прізвище отримувача",
      });
    }
    if (!UA_PHONE_DISPLAY_REGEX.test(values.recipientPhone)) {
      ctx.addIssue({ code: "custom", path: ["recipientPhone"], message: PHONE_MESSAGE });
    }
    if (!values.cityRef) {
      ctx.addIssue({ code: "custom", path: ["cityName"], message: "Оберіть місто зі списку" });
    }
    if (!values.warehouseRef) {
      ctx.addIssue({
        code: "custom",
        path: ["warehouseDescription"],
        message: "Оберіть відділення або поштомат зі списку",
      });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

/** First enabled method is preselected; "none" when the owner disabled delivery entirely */
export function defaultDeliveryMethod(): CheckoutFormValues["deliveryMethod"] {
  return enabledDeliveryMethods()[0] ?? "none";
}

export function checkoutFormDefaults(): CheckoutFormValues {
  return {
    name: "",
    phone: "",
    agreement: false,
    deliveryMethod: defaultDeliveryMethod(),
    recipientName: "",
    recipientPhone: "",
    cityRef: "",
    cityName: "",
    cityPresent: "",
    warehouseRef: "",
    warehouseDescription: "",
    warehouseCategory: "",
  };
}

/** Form values → the delivery object the payment route expects */
export function toDeliveryDetails(values: CheckoutFormValues): DeliveryDetails | undefined {
  if (values.deliveryMethod === "none") return undefined;
  if (values.deliveryMethod === "pickup") return { method: "pickup" };
  return {
    method: "nova_poshta",
    recipient: {
      name: values.recipientName.trim(),
      phone: formatPhoneForAPI(values.recipientPhone),
    },
    city: {
      ref: values.cityRef,
      name: values.cityName,
      present: values.cityPresent || undefined,
    },
    warehouse: {
      ref: values.warehouseRef,
      description: values.warehouseDescription,
      category: values.warehouseCategory === "Postomat" ? "Postomat" : "Branch",
    },
  };
}

export type SelectableDeliveryMethod = DeliveryMethod;
