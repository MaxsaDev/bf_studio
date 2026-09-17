"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RemoveScroll } from "react-remove-scroll";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Certificate } from "@/types/certificate";
import type { AddonId, AddonSelection } from "@/types/addon";
import {
  CertificateCardVisual,
  type CardSticker,
} from "@/components/certificates/certificate-card-visual";
import { AddonsStep } from "@/components/checkout/addons-step";
import { CartStep } from "@/components/checkout/cart-step";
import {
  checkoutFormDefaults,
  checkoutFormSchema,
  toDeliveryDetails,
  type CheckoutFormValues,
} from "@/components/checkout/checkout-form-schema";
import {
  CheckoutProgress,
  type CheckoutScreen,
} from "@/components/checkout/checkout-progress";
import { FIELD_INPUT, FIELD_LABEL, LEGAL_LINK } from "@/components/checkout/checkout-styles";
import { DeliveryFields } from "@/components/checkout/delivery-fields";
import { OrderSummary } from "@/components/checkout/order-summary";
import { cn } from "@/lib/utils";
import {
  CERTIFICATE_IMAGE,
  CERTIFICATE_IMAGE_DARK_OVERLAY,
  NAMED_CERT_TITLE_SIZE,
  NAMED_CERT_TITLE_SIZE_COMPACT,
  NAMED_CERTIFICATE_BACKGROUND,
  GIFT_CERT_DENOMINATION_SIZE,
  GIFT_CERT_DENOMINATION_SIZE_COMPACT,
  GIFT_CERT_CURRENCY_SIZE,
  GIFT_CERT_CURRENCY_SIZE_COMPACT,
  getNamedCertificateColor,
  extractThemeName,
  SPECIAL_CERTIFICATE_SUBTITLE,
  SPECIAL_CERTIFICATE_COLOR,
  MASTER_CLASS_SUBTITLE,
  MASTER_CLASS_SUBTITLE_COLOR,
} from "@/lib/certificate-config";
import {
  createPaymentInvoice,
  type CreateInvoiceRequest,
} from "@/lib/api/payments";
import { formatPhoneDisplay, formatPhoneForAPI } from "@/lib/phone";
import {
  getAvailableAddons,
  resolveAddonLines,
  type AddonLine,
} from "@/lib/addons";
import { addonsToQuantities, resolveCart } from "@/lib/cart";
import { deliveryLabel } from "@/lib/delivery";
import { resolveOrder } from "@/lib/order";
import { savePendingShipment } from "@/lib/pending-shipment";
import type { CartController } from "@/lib/use-cart";
import { certificates } from "@/data/certificates";
import { track } from "@/lib/analytics";
import { siteConfig } from "@/lib/site-config";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  return Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
}

/** The card a visitor just picked in the catalog, waiting to be configured */
export interface PendingProduct {
  certificate: Certificate;
  variantId: string | null;
}

/**
 * Buying is three stages ("Товар - Кошик - Оплата"):
 * 1. product: add-ons for ONE card, "Додати в кошик" (also used to edit a line);
 * 2. cart: every configured card, quantities, "Оформити замовлення";
 * 3. payment: buyer details + purchase list, "Оплатити".
 * Products without add-ons skip stage 1 and land straight in the cart.
 */
interface CheckoutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  /** Screen shown when the dialog opens: "product" for a card just picked, "cart" from the cart button */
  initialScreen: CheckoutScreen;
  /** The card being configured on the product screen; null when opened from the cart */
  pendingProduct: PendingProduct | null;
  cart: CartController;
}

const SCREEN_COPY = {
  product: {
    title: "Додатки",
    subtitle:
      "Зробіть подарунок особливим. Обрані додатки з'являться наліпками на цій BFCard та в кошику.",
  },
  productEdit: {
    title: "Додатки",
    subtitle: "Змініть додатки для цієї BFCard. Наліпки на картці оновляться.",
  },
  cart: {
    title: "Кошик",
    subtitle:
      "Перевірте замовлення. Можна додати ще одну BFCard, змінити кількість або додатки.",
  },
  cartEmpty: {
    title: "Кошик",
    subtitle: "Кошик порожній.",
  },
  payment: {
    title: "Оплата",
    subtitle:
      "Вкажіть дані покупця, а не отримувача подарунка. Адміністратор зв'яжеться з вами для підтвердження.",
  },
} as const;

interface VisualProps {
  title: React.ReactNode;
  titleColor?: string;
  subtitle?: React.ReactNode;
  subtitleColor?: string;
  className?: string;
}

/** `compact` narrows the big typographic titles when sticker columns are reserved */
function getVisualProps(
  certificate: Certificate,
  variantTitle?: string,
  compact = false
): VisualProps {
  switch (certificate.type) {
    case "massage_course":
      return {
        title: certificate.title,
        subtitle: variantTitle,
      };
    case "named_gift_certificate": {
      const themeName = extractThemeName(certificate.title);
      return {
        title: (
          <div className="flex items-center justify-center">
            <span
              className={cn(
                compact ? NAMED_CERT_TITLE_SIZE_COMPACT : NAMED_CERT_TITLE_SIZE,
                "font-light leading-none"
              )}
            >
              {themeName.toUpperCase()}
            </span>
          </div>
        ),
        titleColor: getNamedCertificateColor(themeName),
        subtitle: `${certificate.denomination} ₴`,
        className: NAMED_CERTIFICATE_BACKGROUND,
      };
    }
    case "gift_certificate":
      return {
        title: (
          <div className="flex items-start justify-center leading-[0.8] -space-x-2 ml-8">
            <span
              className={cn(
                compact
                  ? GIFT_CERT_DENOMINATION_SIZE_COMPACT
                  : GIFT_CERT_DENOMINATION_SIZE,
                "font-bold tracking-tighter text-stone-900 dark:text-stone-50"
              )}
            >
              {certificate.denomination}
            </span>
            <span
              className={cn(
                compact ? GIFT_CERT_CURRENCY_SIZE_COMPACT : GIFT_CERT_CURRENCY_SIZE,
                "font-medium text-stone-500 dark:text-stone-400 mt-4 sm:mt-6 tracking-widest"
              )}
            >
              UAH
            </span>
          </div>
        ),
      };
    case "master_class":
      return {
        title: certificate.title,
        subtitle: MASTER_CLASS_SUBTITLE,
        subtitleColor: MASTER_CLASS_SUBTITLE_COLOR,
      };
    case "special":
      return {
        title: certificate.title.toUpperCase(),
        titleColor: SPECIAL_CERTIFICATE_COLOR,
        subtitle: SPECIAL_CERTIFICATE_SUBTITLE,
      };
  }
}

function stickersFromAddonLines(lines: AddonLine[]): CardSticker[] {
  return lines.map(({ addon, qty }) => ({
    id: addon.id,
    icon: addon.icon,
    label: addon.title,
    qty,
  }));
}

export default function CheckoutOverlay({
  isOpen,
  onClose,
  initialScreen,
  pendingProduct,
  cart,
}: CheckoutOverlayProps) {
  const [screen, setScreen] = useState<CheckoutScreen>("cart");
  /** Cart line whose add-ons are being edited on the product screen */
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Partial<Record<AddonId, number>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: checkoutFormDefaults(),
  });
  const watchedDeliveryMethod = form.watch("deliveryMethod");

  // Fresh state on every open
  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);
    setIsSubmitting(false);
    setEditingLineId(null);
    setQuantities({});
    setScreen(initialScreen);
    form.reset(checkoutFormDefaults());
  }, [isOpen, initialScreen, form]);

  // Closing mid-request would leave a stray invoice and still redirect
  // afterwards - ignore Esc / backdrop / close while submitting.
  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);

  // Return focus to the opener when the dialog closes
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => previouslyFocused?.focus();
  }, [isOpen]);

  // Each screen starts at the top of the scroll area (the container persists across screens)
  useEffect(() => {
    if (isOpen) contentRef.current?.scrollTo({ top: 0 });
  }, [isOpen, screen]);

  // Move focus into the current screen: the first text input, else the first
  // real control (the close X is skipped so focus lands on the content)
  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = setTimeout(() => {
      const focusable = getFocusable(dialogRef.current).filter(
        (el) => !el.hasAttribute("data-autofocus-skip")
      );
      (
        focusable.find(
          (el) => el.tagName === "INPUT" && el.getAttribute("type") !== "checkbox"
        ) ?? focusable[0]
      )?.focus();
    }, 50);
    return () => clearTimeout(focusTimer);
  }, [isOpen, screen]);

  // Keyboard: Escape closes, Tab cycles inside the dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable(dialogRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const resolvedCart = useMemo(() => resolveCart(cart.lines), [cart.lines]);

  // The card on the product screen: a fresh pick, or an existing line being edited
  const editingLine = editingLineId
    ? cart.lines.find((line) => line.id === editingLineId) ?? null
    : null;
  const editingCertificate = editingLine
    ? certificates.find((c) => c.id === editingLine.certificateId) ?? null
    : null;
  const configuring: PendingProduct | null =
    editingLine && editingCertificate
      ? { certificate: editingCertificate, variantId: editingLine.variantId }
      : pendingProduct;

  const availableAddons = configuring
    ? getAvailableAddons(configuring.certificate, configuring.variantId)
    : [];
  const configuredAddonLines = configuring
    ? resolveAddonLines(configuring.certificate, configuring.variantId, quantities)
    : [];
  const configuredOrder = configuring
    ? resolveOrder(configuring.certificate, configuring.variantId, configuredAddonLines)
    : null;

  // Nothing to configure (e.g. stale state) → show the cart instead
  const activeScreen: CheckoutScreen =
    screen === "product" && !configuring ? "cart" : screen;

  // Card floating above the dialog: the product being configured (stickers
  // preview). On the cart and payment screens only while the cart holds a
  // single card configuration - with several, one card would misrepresent
  // the order, so the panel simply starts at the top.
  const soleLine = resolvedCart.lines.length === 1 ? resolvedCart.lines[0] : undefined;
  const featured =
    activeScreen === "product" && configuring && configuredOrder
      ? {
          certificate: configuring.certificate,
          variantTitle: configuredOrder.variantTitle,
          stickers: stickersFromAddonLines(configuredAddonLines),
          hasStickerArea: availableAddons.length > 0,
        }
      : soleLine
        ? {
            certificate: soleLine.certificate,
            variantTitle: soleLine.order.variantTitle,
            stickers: stickersFromAddonLines(soleLine.order.addonLines),
            hasStickerArea:
              getAvailableAddons(soleLine.certificate, soleLine.line.variantId).length > 0,
          }
        : null;

  const setAddonQty = (id: AddonId, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: qty }));
    if (configuring) {
      track("addon_changed", { certificate_id: configuring.certificate.id, addon_id: id, qty });
    }
  };

  /** "Додати в кошик" for a new card, "Зберегти" for an edited line */
  const commitProduct = () => {
    if (!configuring) return;
    const addons: AddonSelection[] = configuredAddonLines.map(({ addon, qty }) => ({
      id: addon.id,
      qty,
    }));
    if (editingLine) {
      cart.updateAddons(editingLine.id, addons);
    } else {
      cart.add({
        certificateId: configuring.certificate.id,
        variantId: configuring.variantId,
        addons,
      });
    }
    setEditingLineId(null);
    setScreen("cart");
  };

  const startEditingLine = (id: string) => {
    const line = cart.lines.find((l) => l.id === id);
    if (!line) return;
    setEditingLineId(id);
    setQuantities(addonsToQuantities(line.addons));
    setScreen("product");
  };

  const backToCart = () => {
    setEditingLineId(null);
    setScreen("cart");
  };

  const proceedToPayment = () => {
    if (resolvedCart.lines.length === 0) return;
    track("checkout_started", {
      items: resolvedCart.lines.length,
      cards: resolvedCart.count,
      amount: resolvedCart.total,
    });
    setScreen("payment");
  };

  async function onSubmit(values: CheckoutFormValues) {
    if (resolvedCart.lines.length === 0) {
      setScreen("cart");
      return;
    }

    const delivery = toDeliveryDetails(values);

    setIsSubmitting(true);
    setSubmitError(null);
    track("checkout_submitted", {
      items: resolvedCart.lines.length,
      cards: resolvedCart.count,
      amount: resolvedCart.total,
      delivery_method: delivery?.method,
    });

    try {
      // Only WHAT is bought goes over the wire - the route resolves every price
      const invoiceRequest: CreateInvoiceRequest = {
        items: resolvedCart.lines.map(({ line }) => ({
          certificateId: line.certificateId,
          variantId: line.variantId,
          addons: line.addons,
          qty: line.qty,
        })),
        name: values.name.trim(),
        phone: formatPhoneForAPI(values.phone),
        delivery,
      };

      const response = await createPaymentInvoice(invoiceRequest);

      if (response.url) {
        // Remember the shipment so the waybill can be created once the payment is confirmed
        if (
          response.clientToken &&
          response.orderReference &&
          delivery?.method === "nova_poshta"
        ) {
          savePendingShipment({
            orderReference: response.orderReference,
            clientToken: response.clientToken,
            summary: {
              recipientName: delivery.recipient.name,
              cityName: delivery.city.present ?? delivery.city.name,
              warehouseDescription: delivery.warehouse.description,
            },
          });
        }
        track("payment_redirect", { amount: resolvedCart.total });
        window.location.href = response.url;
      } else {
        throw new Error(
          "Не вдалося отримати посилання для оплати. Спробуйте ще раз."
        );
      }
    } catch (error) {
      console.error("Payment creation failed:", error);
      track("payment_error", { amount: resolvedCart.total });
      setIsSubmitting(false);
      const fallbackMessage = "Не вдалося створити платіж. Спробуйте ще раз.";
      setSubmitError(
        error instanceof Error && error.message ? error.message : fallbackMessage
      );
    }
  }

  const copy =
    activeScreen === "product"
      ? editingLine
        ? SCREEN_COPY.productEdit
        : SCREEN_COPY.product
      : activeScreen === "cart"
        ? resolvedCart.lines.length > 0
          ? SCREEN_COPY.cart
          : SCREEN_COPY.cartEmpty
        : SCREEN_COPY.payment;

  const visualProps = featured
    ? getVisualProps(featured.certificate, featured.variantTitle, featured.hasStickerArea)
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <RemoveScroll>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* Backdrop - static blur, animate opacity only (animating backdrop-filter is expensive) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 backdrop-blur-2xl bg-linear-to-br from-stone-900/30 via-stone-900/20 to-black/40 dark:from-black/70 dark:via-black/60 dark:to-black/80"
              onClick={handleClose}
            />

            {/* Main Container */}
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-title"
              className="relative w-full h-dvh sm:h-auto sm:max-h-[92vh] sm:w-[700px] flex flex-col items-center justify-center sm:justify-start sm:pt-8 px-4 sm:px-0"
              style={{ perspective: "1200px" }}
            >
              {/* Floating Certificate Card with Left-Right Tilt */}
              {featured && visualProps && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotateY: [-3, 3, -3],
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    rotateY: {
                      repeat: Infinity,
                      duration: 6,
                      ease: "easeInOut",
                    },
                    opacity: { duration: 0.4 },
                    scale: {
                      type: "spring",
                      damping: 20,
                      stiffness: 300,
                    },
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                  className="relative w-[80%] sm:w-[80%] max-w-[550px] -mb-10 sm:-mb-16 z-20"
                >
                  <div className="relative w-full aspect-1115/700 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.7)] ring-1 ring-stone-900/10 dark:ring-white/10">
                    <CertificateCardVisual
                      {...visualProps}
                      layoutId={`card-visual-${featured.certificate.id}`}
                      className={cn(
                        "w-full h-full absolute inset-0 transform-none!",
                        visualProps.className
                      )}
                      imageSrc={CERTIFICATE_IMAGE}
                      isDark={CERTIFICATE_IMAGE_DARK_OVERLAY}
                      stickers={featured.hasStickerArea ? featured.stickers : undefined}
                    />
                  </div>
                </motion.div>
              )}

              {/* Form Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  type: "spring",
                  damping: 30,
                  stiffness: 300,
                  mass: 0.8,
                }}
                className="relative w-full sm:w-[90%] max-w-[700px] bg-white/95 dark:bg-[#1C1917]/98 backdrop-blur-2xl shadow-[0_32px_128px_rgba(0,0,0,0.24)] dark:shadow-[0_32px_128px_rgba(0,0,0,0.6)] rounded-[24px] sm:rounded-[40px] overflow-hidden flex flex-col border border-stone-200/50 dark:border-stone-800/50 z-10"
              >
                {/* Content area; extra top padding makes room for the floating card */}
                <div
                  ref={contentRef}
                  className={cn(
                    "flex-1 overflow-y-auto pb-6 px-6 sm:px-6",
                    featured ? "pt-16 sm:pt-24" : "pt-6 sm:pt-8"
                  )}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="space-y-5"
                  >
                    {/* Header */}
                    <div className="space-y-1.5 pb-4 border-b border-stone-200/60 dark:border-stone-800/60">
                      <div className="flex items-center justify-between gap-3">
                        <CheckoutProgress current={activeScreen} />
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={isSubmitting}
                          aria-label="Закрити"
                          data-autofocus-skip
                          className="-mr-2 rounded-full p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <h2
                        id="checkout-title"
                        className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-50 tracking-tight"
                      >
                        {copy.title}
                      </h2>
                      <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                        {copy.subtitle}
                      </p>
                    </div>

                    {/* Screen body: keyed so each screen slides in; no exit animation keeps focus management simple */}
                    <motion.div
                      key={`${activeScreen}-${editingLineId ?? ""}`}
                      initial={{ opacity: 0, x: activeScreen === "product" ? -24 : 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      {activeScreen === "product" && configuredOrder ? (
                        <AddonsStep
                          available={availableAddons}
                          quantities={quantities}
                          onChange={setAddonQty}
                          addonsTotal={configuredOrder.addonsTotal}
                          unitTotal={configuredOrder.total}
                          primaryLabel={editingLine ? "Зберегти" : "Додати в кошик"}
                          onPrimary={commitProduct}
                          secondaryLabel={editingLine ? "Назад до кошика" : "Скасувати"}
                          onSecondary={editingLine ? backToCart : handleClose}
                        />
                      ) : activeScreen === "cart" ? (
                        <CartStep
                          cart={resolvedCart}
                          canEditAddons={(resolved) =>
                            getAvailableAddons(resolved.certificate, resolved.line.variantId)
                              .length > 0
                          }
                          onQty={cart.setQty}
                          onRemove={cart.remove}
                          onEditAddons={startEditingLine}
                          onCheckout={proceedToPayment}
                          onContinueShopping={handleClose}
                          onClear={cart.clear}
                        />
                      ) : (
                        <Form {...form}>
                          <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                          >
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={FIELD_LABEL}>
                                    Ім'я покупця
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Введіть ваше ім'я"
                                      autoComplete="name"
                                      {...field}
                                      className={FIELD_INPUT}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs mt-1.5" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={FIELD_LABEL}>
                                    Телефон покупця
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="tel"
                                      inputMode="tel"
                                      autoComplete="tel"
                                      placeholder="+38 (0__) ___-__-__"
                                      className={cn(FIELD_INPUT, "font-mono")}
                                      onChange={(e) => {
                                        field.onChange(
                                          formatPhoneDisplay(e.target.value)
                                        );
                                      }}
                                      maxLength={19}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs mt-1.5" />
                                </FormItem>
                              )}
                            />

                            {/* Pickup or Nova Poshta delivery to a recipient */}
                            <DeliveryFields disabled={isSubmitting} />

                            {/* Agreement */}
                            <FormField
                              control={form.control}
                              name="agreement"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl bg-stone-50/50 dark:bg-stone-900/30 p-3.5 border border-stone-200/40 dark:border-stone-800/40">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="mt-0.5 shrink-0 data-[state=checked]:bg-stone-900 data-[state=checked]:border-stone-900 dark:data-[state=checked]:bg-stone-50 dark:data-[state=checked]:border-stone-50 border-stone-400 dark:border-stone-600 w-4 h-4 rounded-md transition-all duration-200"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <FormLabel className="text-xs font-normal text-stone-700 dark:text-stone-300 cursor-pointer leading-relaxed block">
                                      Я погоджуюсь з{" "}
                                      <a
                                        href={siteConfig.legal.agreement.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={LEGAL_LINK}
                                      >
                                        Угодою користувача
                                      </a>{" "}
                                      та{" "}
                                      <a
                                        href={siteConfig.legal.privacy.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={LEGAL_LINK}
                                      >
                                        Політикою конфіденційності
                                      </a>
                                    </FormLabel>
                                    <FormMessage className="text-xs" />
                                  </div>
                                </FormItem>
                              )}
                            />

                            {/* Purchase list + total */}
                            <div className="pt-3 space-y-4">
                              <OrderSummary
                                cart={resolvedCart}
                                deliveryLabel={
                                  watchedDeliveryMethod === "none"
                                    ? undefined
                                    : watchedDeliveryMethod === "nova_poshta"
                                      ? `${deliveryLabel("nova_poshta")}${siteConfig.delivery.novaPoshta.recipientPays ? " · оплата при отриманні" : ""}`
                                      : deliveryLabel(watchedDeliveryMethod)
                                }
                              />

                              {/* Submit Error */}
                              <AnimatePresence>
                                {submitError && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    role="alert"
                                    className="flex items-start gap-2.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 p-3.5 text-sm text-red-700 dark:text-red-400"
                                  >
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{submitError}</span>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div className="space-y-3">
                                <Button
                                  type="submit"
                                  className="w-full h-12 rounded-2xl text-base font-semibold tracking-wide bg-stone-900 dark:bg-stone-50 text-stone-50 dark:text-stone-900 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-2xl shadow-stone-900/20 dark:shadow-stone-950/40 hover:shadow-stone-900/30 dark:hover:shadow-stone-950/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                      <span>Обробка...</span>
                                    </>
                                  ) : (
                                    "Оплатити"
                                  )}
                                </Button>
                                <button
                                  type="button"
                                  onClick={backToCart}
                                  disabled={isSubmitting}
                                  className="w-full inline-flex items-center justify-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors duration-200 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                                  Назад до кошика
                                </button>
                              </div>
                            </div>
                          </form>
                        </Form>
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </RemoveScroll>
      )}
    </AnimatePresence>
  );
}
