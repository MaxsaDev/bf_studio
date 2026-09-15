import { ADDON_MAX_QTY, addons, getAddon } from "@/data/addons";
import { siteConfig } from "@/lib/site-config";
import type {
  Addon,
  AddonId,
  AddonLimits,
  AddonSelection,
} from "@/types/addon";
import type { Certificate } from "@/types/certificate";

/**
 * Add-on ("додаток") resolution shared by the checkout UI and the payment
 * route. The route uses the strict validator; the UI uses the lenient
 * resolver so a stale selection (e.g. after a variant switch) just drops out.
 */

export function isAddonUpsellEnabled(): boolean {
  return siteConfig.features.addons.enabled;
}

/**
 * Max quantity per add-on for one product. Course variants carry their own
 * limits; everything else reads the certificate. Empty when the upsell is
 * switched off in site-config.
 */
export function getAddonLimits(
  certificate: Certificate,
  variantId?: string | null
): AddonLimits {
  if (!isAddonUpsellEnabled()) return {};

  if (certificate.type === "massage_course") {
    const variant = certificate.variants.find((v) => v.id === variantId);
    return variant?.addons ?? certificate.addons ?? {};
  }

  return certificate.addons ?? {};
}

export interface AvailableAddon {
  addon: Addon;
  /** 1 = single toggle, >1 = quantity picker up to this value */
  maxQty: number;
}

/** Add-ons offered for this product, in catalog order */
export function getAvailableAddons(
  certificate: Certificate,
  variantId?: string | null
): AvailableAddon[] {
  const limits = getAddonLimits(certificate, variantId);

  return addons.flatMap((addon) => {
    const maxQty = Math.min(limits[addon.id] ?? 0, ADDON_MAX_QTY);
    return maxQty > 0 ? [{ addon, maxQty }] : [];
  });
}

export interface AddonLine {
  addon: Addon;
  qty: number;
  /** price × qty */
  total: number;
}

export type AddonValidation =
  | { ok: true; lines: AddonLine[] }
  | { ok: false; reason: string };

/**
 * Strict check for the payment route: unknown id, duplicate, not offered for
 * this product, or quantity outside 1..max all reject the whole request.
 */
export function validateAddonSelection(
  certificate: Certificate,
  variantId: string | null | undefined,
  selection: AddonSelection[]
): AddonValidation {
  const limits = getAddonLimits(certificate, variantId);
  const seen = new Set<AddonId>();
  const lines: AddonLine[] = [];

  for (const { id, qty } of selection) {
    const addon = getAddon(id);
    if (!addon) return { ok: false, reason: `Unknown add-on: ${id}` };
    if (seen.has(id)) return { ok: false, reason: `Duplicate add-on: ${id}` };
    seen.add(id);

    const maxQty = Math.min(limits[id] ?? 0, ADDON_MAX_QTY);
    if (maxQty === 0) {
      return { ok: false, reason: `Add-on not offered for this product: ${id}` };
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > maxQty) {
      return { ok: false, reason: `Quantity out of range for ${id}: ${qty}` };
    }

    lines.push({ addon, qty, total: addon.price * qty });
  }

  // Keep catalog order regardless of how the client ordered them
  lines.sort(
    (a, b) =>
      addons.findIndex((x) => x.id === a.addon.id) -
      addons.findIndex((x) => x.id === b.addon.id)
  );

  return { ok: true, lines };
}

/**
 * Lenient resolver for the UI: clamps quantities to the limit and silently
 * drops anything not offered, so the summary always reflects what the
 * server would accept.
 */
export function resolveAddonLines(
  certificate: Certificate,
  variantId: string | null | undefined,
  quantities: Partial<Record<AddonId, number>>
): AddonLine[] {
  return getAvailableAddons(certificate, variantId).flatMap(
    ({ addon, maxQty }) => {
      const qty = Math.min(Math.max(Math.floor(quantities[addon.id] ?? 0), 0), maxQty);
      return qty > 0 ? [{ addon, qty, total: addon.price * qty }] : [];
    }
  );
}

export function sumAddonLines(lines: AddonLine[]): number {
  return lines.reduce((sum, line) => sum + line.total, 0);
}

/**
 * "Масаж стоп 2 шт, Ефірні олії" — quantity shown only when above one.
 * Appended to the payment description, so it also reaches the admin SMS.
 */
export function describeAddons(lines: AddonLine[]): string {
  return lines
    .map(({ addon, qty }) => (qty > 1 ? `${addon.title} ${qty} шт` : addon.title))
    .join(", ");
}
