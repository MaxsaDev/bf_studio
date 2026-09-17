import * as z from "zod";
import { MAX_ORDER_DESCRIPTION_LENGTH } from "@/lib/cart";
import { UA_PHONE_API_REGEX } from "@/lib/phone";
import { siteConfig } from "@/lib/site-config";
import type { DeliveryDetails, DeliveryMethod } from "@/types/delivery";

/**
 * Delivery details shared by the checkout form and the payment route (the
 * payments service validates them again and owns the waybill). Validation is
 * strict on the server; the UI mirrors it.
 */

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nova Poshta needs first AND last name, so two words minimum */
export const recipientNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, {
    message: "Вкажіть ім'я та прізвище отримувача",
  });

export const novaPoshtaDeliverySchema = z.object({
  method: z.literal("nova_poshta"),
  recipient: z.object({
    name: recipientNameSchema,
    phone: z.string().regex(UA_PHONE_API_REGEX),
  }),
  city: z.object({
    ref: z.string().regex(UUID_REGEX),
    name: z.string().trim().min(1).max(120),
    present: z.string().trim().max(200).optional(),
  }),
  warehouse: z.object({
    ref: z.string().regex(UUID_REGEX),
    description: z.string().trim().min(1).max(200),
    category: z.enum(["Branch", "Postomat"]),
  }),
});

export const pickupDeliverySchema = z.object({
  method: z.literal("pickup"),
});

export const electronicDeliverySchema = z.object({
  method: z.literal("electronic"),
});

export const deliverySchema = z.discriminatedUnion("method", [
  pickupDeliverySchema,
  novaPoshtaDeliverySchema,
  electronicDeliverySchema,
]);

/** Every method in display order; the first enabled one is preselected */
export const DELIVERY_METHODS = ["pickup", "nova_poshta", "electronic"] as const satisfies readonly DeliveryMethod[];

/** The site-config entry of one method: switch, label, note */
export function deliveryOptionConfig(method: DeliveryMethod) {
  switch (method) {
    case "pickup":
      return siteConfig.delivery.pickup;
    case "nova_poshta":
      return siteConfig.delivery.novaPoshta;
    case "electronic":
      return siteConfig.delivery.electronic;
  }
}

/** Methods the owner switched on in site-config, in display order; the first one is preselected */
export function enabledDeliveryMethods(): DeliveryMethod[] {
  return DELIVERY_METHODS.filter((method) => deliveryOptionConfig(method).enabled);
}

export function isDeliveryMethodEnabled(method: DeliveryMethod): boolean {
  return enabledDeliveryMethods().includes(method);
}

/** "Відділення №5 (до 30 кг): вул. Шевченка, 60" → "Відділення №5" */
export function shortWarehouseLabel(
  description: string,
  category: "Branch" | "Postomat"
): string {
  const match = description.match(/№\s*([^\s:,(]+)/);
  const kind = category === "Postomat" ? "Поштомат" : "Відділення";
  return match ? `${kind} №${match[1]}` : kind;
}

/** One human-readable line for the cart summary */
export function deliveryLabel(method: DeliveryMethod): string {
  return deliveryOptionConfig(method).label;
}

/**
 * Compact delivery text for the payment description. It reaches the admin
 * SMS / Telegram, so a shipment can be created by hand if the automatic
 * waybill never happens (buyer closed the tab after paying).
 */
export function describeDelivery(delivery: DeliveryDetails): string {
  if (delivery.method === "pickup") return "Самовивіз зі студії";
  if (delivery.method === "electronic") return "Електронна BFCard";
  const { recipient, city, warehouse } = delivery;
  return `Нова пошта: ${city.name}, ${shortWarehouseLabel(warehouse.description, warehouse.category)}, ${recipient.name} ${recipient.phone}`;
}

/** Items first, delivery last; the items get cut so the delivery always fits */
export function withDeliveryDescription(
  itemsDescription: string,
  delivery: DeliveryDetails | undefined
): string {
  if (!delivery) return itemsDescription;
  const tail = `. Доставка: ${describeDelivery(delivery)}`;
  const room = Math.max(20, MAX_ORDER_DESCRIPTION_LENGTH - tail.length);
  const head =
    itemsDescription.length > room
      ? `${itemsDescription.slice(0, room - 1).trimEnd()}…`
      : itemsDescription;
  return `${head}${tail}`;
}
