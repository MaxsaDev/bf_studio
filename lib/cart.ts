import { addons as addonCatalog } from "@/data/addons";
import { certificates } from "@/data/certificates";
import {
  describeAddons,
  isAddonUpsellEnabled,
  resolveAddonLines,
} from "@/lib/addons";
import { resolveOrder, type ResolvedOrder } from "@/lib/order";
import type { AddonId, AddonSelection } from "@/types/addon";
import type { CartLine, CartLineInput } from "@/types/cart";
import type { Certificate } from "@/types/certificate";

/**
 * Cart logic shared by the browser (useCart, checkout screens) and the
 * payment route. Pure functions over the static catalog: the route
 * recomputes every amount from `items[]` with the same code the UI used.
 */

export const CART_MAX_LINES = 10;
export const CART_MAX_LINE_QTY = 10;
/** WayForPay gets one product name; keep it (and the admin SMS) readable */
export const MAX_ORDER_DESCRIPTION_LENGTH = 250;

export function makeLineId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clampLineQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(CART_MAX_LINE_QTY, Math.max(1, Math.floor(qty)));
}

/** Catalog order, whole quantities >= 1, one entry per id (last wins) */
export function normalizeAddons(selection: AddonSelection[]): AddonSelection[] {
  const byId = new Map<AddonId, number>();
  for (const { id, qty } of selection) {
    if (Number.isFinite(qty) && qty >= 1) byId.set(id, Math.floor(qty));
  }
  return addonCatalog.flatMap((addon) => {
    const qty = byId.get(addon.id);
    return qty ? [{ id: addon.id, qty }] : [];
  });
}

export function addonsToQuantities(
  selection: AddonSelection[]
): Partial<Record<AddonId, number>> {
  return Object.fromEntries(selection.map((a) => [a.id, a.qty])) as Partial<
    Record<AddonId, number>
  >;
}

/** Same product, same variant, same add-ons (in any order) */
export function isSameProduct(a: CartLineInput, b: CartLineInput): boolean {
  if (a.certificateId !== b.certificateId) return false;
  if ((a.variantId ?? null) !== (b.variantId ?? null)) return false;
  const na = normalizeAddons(a.addons);
  const nb = normalizeAddons(b.addons);
  return (
    na.length === nb.length &&
    na.every((x, i) => x.id === nb[i].id && x.qty === nb[i].qty)
  );
}

/**
 * Add a card. An identical configuration already in the cart just gains
 * quantity; a full cart (CART_MAX_LINES distinct lines) is left unchanged.
 */
export function addToCart(
  lines: CartLine[],
  input: CartLineInput,
  qty = 1
): CartLine[] {
  const normalized: CartLineInput = {
    certificateId: input.certificateId,
    variantId: input.variantId ?? null,
    addons: normalizeAddons(input.addons),
  };

  const existing = lines.find((line) => isSameProduct(line, normalized));
  if (existing) {
    return lines.map((line) =>
      line.id === existing.id
        ? { ...line, qty: clampLineQty(line.qty + qty) }
        : line
    );
  }

  if (lines.length >= CART_MAX_LINES) return lines;
  return [...lines, { ...normalized, id: makeLineId(), qty: clampLineQty(qty) }];
}

export function removeFromCart(lines: CartLine[], id: string): CartLine[] {
  return lines.filter((line) => line.id !== id);
}

/** Quantity below one removes the line */
export function setCartLineQty(
  lines: CartLine[],
  id: string,
  qty: number
): CartLine[] {
  if (qty < 1) return removeFromCart(lines, id);
  return lines.map((line) =>
    line.id === id ? { ...line, qty: clampLineQty(qty) } : line
  );
}

/** Replace a line's add-ons; if that makes it identical to another line the two merge */
export function updateCartLineAddons(
  lines: CartLine[],
  id: string,
  addons: AddonSelection[]
): CartLine[] {
  const target = lines.find((line) => line.id === id);
  if (!target) return lines;

  const updated: CartLine = { ...target, addons: normalizeAddons(addons) };
  const twin = lines.find((line) => line.id !== id && isSameProduct(line, updated));
  if (twin) {
    return lines
      .filter((line) => line.id !== id)
      .map((line) =>
        line.id === twin.id
          ? { ...line, qty: clampLineQty(line.qty + updated.qty) }
          : line
      );
  }
  return lines.map((line) => (line.id === id ? updated : line));
}

export interface ResolvedCartLine {
  line: CartLine;
  certificate: Certificate;
  /** Price breakdown for ONE card of this line */
  order: ResolvedOrder;
  /** order.total × qty */
  lineTotal: number;
}

export interface ResolvedCart {
  lines: ResolvedCartLine[];
  /** Total number of cards across all lines */
  count: number;
  total: number;
  description: string;
}

/**
 * Lenient resolution: unknown products drop out, add-ons are clamped to what
 * the product offers today (removed entirely when the upsell is switched
 * off), quantity is clamped. The payment route validates strictly first, so
 * for a valid request this is exact.
 */
export function resolveCartLine(line: CartLine): ResolvedCartLine | null {
  const certificate = certificates.find((c) => c.id === line.certificateId);
  if (!certificate) return null;

  const isCourse = certificate.type === "massage_course";
  const variantId = isCourse ? line.variantId : null;
  if (isCourse && !certificate.variants.some((v) => v.id === variantId)) {
    return null;
  }

  const addonLines = isAddonUpsellEnabled()
    ? resolveAddonLines(certificate, variantId, addonsToQuantities(line.addons))
    : [];
  const order = resolveOrder(certificate, variantId, addonLines);
  const qty = clampLineQty(line.qty);

  return {
    line: {
      ...line,
      variantId,
      qty,
      addons: addonLines.map(({ addon, qty: addonQty }) => ({
        id: addon.id,
        qty: addonQty,
      })),
    },
    certificate,
    order,
    lineTotal: order.total * qty,
  };
}

export function resolveCart(lines: CartLine[]): ResolvedCart {
  const resolved = lines.flatMap((line) => {
    const r = resolveCartLine(line);
    return r ? [r] : [];
  });
  return {
    lines: resolved,
    count: resolved.reduce((sum, r) => sum + r.line.qty, 0),
    total: resolved.reduce((sum, r) => sum + r.lineTotal, 0),
    description: describeCart(resolved),
  };
}

/**
 * One card → the same description as before the cart existed.
 * Several → "2 шт Послуги масажу 500 грн (Додатки: Ефірні олії); Курс …",
 * cut with an ellipsis past MAX_ORDER_DESCRIPTION_LENGTH.
 */
export function describeCart(lines: ResolvedCartLine[]): string {
  if (lines.length === 0) return "";
  if (lines.length === 1 && lines[0].line.qty === 1) {
    return lines[0].order.orderDescription;
  }

  const text = lines
    .map(({ line, order }) => {
      const qty = line.qty > 1 ? `${line.qty} шт ` : "";
      const extras =
        order.addonLines.length > 0
          ? ` (Додатки: ${describeAddons(order.addonLines)})`
          : "";
      return `${qty}${order.description}${extras}`;
    })
    .join("; ");

  return text.length > MAX_ORDER_DESCRIPTION_LENGTH
    ? `${text.slice(0, MAX_ORDER_DESCRIPTION_LENGTH - 1).trimEnd()}…`
    : text;
}

function isAddonSelection(value: unknown): value is AddonSelection {
  if (!value || typeof value !== "object") return false;
  const v = value as { id?: unknown; qty?: unknown };
  return typeof v.id === "string" && typeof v.qty === "number";
}

/** Anything from storage: keep only lines the catalog still knows, normalised */
export function sanitizeCartLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];

  const out: CartLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.certificateId !== "number") continue;

    const line: CartLine = {
      id: typeof o.id === "string" && o.id ? o.id : makeLineId(),
      certificateId: o.certificateId,
      variantId: typeof o.variantId === "string" ? o.variantId : null,
      addons: Array.isArray(o.addons) ? o.addons.filter(isAddonSelection) : [],
      qty: typeof o.qty === "number" ? o.qty : 1,
    };

    const resolved = resolveCartLine(line);
    if (resolved) out.push(resolved.line);
    if (out.length >= CART_MAX_LINES) break;
  }
  return out;
}
