"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle } from "lucide-react";
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
import { CertificateCardVisual } from "@/components/certificates/certificate-card-visual";
import { cn } from "@/lib/utils";
import {
  CERTIFICATE_IMAGE,
  CERTIFICATE_IMAGE_DARK_OVERLAY,
  NAMED_CERT_TITLE_SIZE,
  NAMED_CERTIFICATE_BACKGROUND,
  GIFT_CERT_DENOMINATION_SIZE,
  GIFT_CERT_CURRENCY_SIZE,
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
import {
  formatPhoneDisplay,
  formatPhoneForAPI,
  UA_PHONE_DISPLAY_REGEX,
} from "@/lib/phone";
import { resolvePrice, formatDiscountEndDate } from "@/lib/pricing";
import { track } from "@/lib/analytics";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Ім'я повинно містити мінімум 2 символи",
  }),
  phone: z.string().regex(UA_PHONE_DISPLAY_REGEX, {
    message: "Введіть коректний номер телефону",
  }),
  agreement: z.boolean().refine((val) => val === true, {
    message: "Необхідно погодитись з умовами",
  }),
});

interface CheckoutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
  variantId: string | null;
}

interface VisualProps {
  title: React.ReactNode;
  titleColor?: string;
  subtitle?: React.ReactNode;
  subtitleColor?: string;
  className?: string;
}

function getVisualProps(
  certificate: Certificate,
  variantTitle?: string
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
              className={cn(NAMED_CERT_TITLE_SIZE, "font-light leading-none")}
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
                GIFT_CERT_DENOMINATION_SIZE,
                "font-bold tracking-tighter text-stone-900 dark:text-stone-50"
              )}
            >
              {certificate.denomination}
            </span>
            <span
              className={cn(
                GIFT_CERT_CURRENCY_SIZE,
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

export default function CheckoutOverlay({
  isOpen,
  onClose,
  certificate,
  variantId,
}: CheckoutOverlayProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      agreement: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      setIsSubmitting(false);
      form.reset({
        name: "",
        phone: "",
        agreement: false,
      });
    }
  }, [isOpen, form]);

  // Dialog behavior: Escape to close, focus trap, focus restore
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    // Move focus into the dialog
    const focusTimer = setTimeout(() => getFocusable()[0]?.focus(), 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable();
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
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!certificate) return null;

  const resolved = resolvePrice(certificate, variantId);
  const { basePrice, finalPrice, discount, itemTitle, variantTitle } = resolved;
  const discountDeadline = discount?.endDate
    ? formatDiscountEndDate(discount.endDate)
    : null;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!certificate) return;

    setIsSubmitting(true);
    setSubmitError(null);
    track("checkout_submitted", {
      certificate_id: certificate.id,
      variant_id: variantId ?? undefined,
      amount: finalPrice,
    });

    try {
      const invoiceRequest: CreateInvoiceRequest = {
        amount: finalPrice,
        orderDescription: resolved.description,
        name: values.name,
        phone: formatPhoneForAPI(values.phone),
        regular: "none",
        userId: `cert_${certificate.id}_${variantId || "main"}_${Date.now()}`,
      };

      const response = await createPaymentInvoice(invoiceRequest);

      if (response.url) {
        track("payment_redirect", { certificate_id: certificate.id });
        window.location.href = response.url;
      } else {
        throw new Error(
          "Не вдалося отримати посилання для оплати. Спробуйте ще раз."
        );
      }
    } catch (error) {
      console.error("Payment creation failed:", error);
      track("payment_error", { certificate_id: certificate.id });
      setIsSubmitting(false);
      const fallbackMessage = "Не вдалося створити платіж. Спробуйте ще раз.";
      setSubmitError(
        error instanceof Error && error.message ? error.message : fallbackMessage
      );
    }
  }

  const visualProps = getVisualProps(certificate, variantTitle);

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
            {/* Backdrop — static blur, animate opacity only (animating backdrop-filter is expensive) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 backdrop-blur-2xl bg-linear-to-br from-stone-900/30 via-stone-900/20 to-black/40 dark:from-black/70 dark:via-black/60 dark:to-black/80"
              onClick={onClose}
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
                    layoutId={`card-visual-${certificate.id}`}
                    className={cn(
                      "w-full h-full absolute inset-0 transform-none!",
                      visualProps.className
                    )}
                    imageSrc={CERTIFICATE_IMAGE}
                    isDark={CERTIFICATE_IMAGE_DARK_OVERLAY}
                  />
                </div>
              </motion.div>

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
                {/* Content Area with top padding for floating card */}
                <div className="flex-1 overflow-y-auto pt-16 sm:pt-24 pb-6 px-6 sm:px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="space-y-5"
                  >
                    {/* Premium Header - Compact */}
                    <div className="space-y-1.5 pb-4 border-b border-stone-200/60 dark:border-stone-800/60">
                      <h2
                        id="checkout-title"
                        className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-50 tracking-tight"
                      >
                        Оформлення
                      </h2>
                      <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                        Заповніть дані для отримання BFCard
                      </p>
                    </div>

                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                      >
                        {/* Form Fields - Compact */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[11px] uppercase tracking-[0.15em] font-medium text-stone-600 dark:text-stone-400 mb-2 block">
                                Ім'я
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Введіть ваше ім'я"
                                  autoComplete="name"
                                  {...field}
                                  className="h-12 text-base bg-stone-50/80 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl px-5 focus-visible:ring-2 focus-visible:ring-stone-400 dark:focus-visible:ring-stone-600 focus-visible:border-transparent transition-all duration-300 hover:border-stone-300 dark:hover:border-stone-600 placeholder:text-stone-400 dark:placeholder:text-stone-600"
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
                              <FormLabel className="text-[11px] uppercase tracking-[0.15em] font-medium text-stone-600 dark:text-stone-400 mb-2 block">
                                Телефон
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="tel"
                                  inputMode="tel"
                                  autoComplete="tel"
                                  placeholder="+38 (0__) ___-__-__"
                                  className="h-12 text-base font-mono bg-stone-50/80 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl px-5 focus-visible:ring-2 focus-visible:ring-stone-400 dark:focus-visible:ring-stone-600 focus-visible:border-transparent transition-all duration-300 hover:border-stone-300 dark:hover:border-stone-600 placeholder:text-stone-400 dark:placeholder:text-stone-600"
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

                        {/* Checkbox - Mobile Optimized */}
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
                                    href="/agreement"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium underline underline-offset-2 decoration-stone-400 hover:decoration-stone-900 dark:hover:decoration-stone-100 hover:text-stone-900 dark:hover:text-stone-100 transition-all duration-200 whitespace-nowrap"
                                  >
                                    Угодою користувача
                                  </a>{" "}
                                  та{" "}
                                  <a
                                    href="/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium underline underline-offset-2 decoration-stone-400 hover:decoration-stone-900 dark:hover:decoration-stone-100 hover:text-stone-900 dark:hover:text-stone-100 transition-all duration-200 whitespace-nowrap"
                                  >
                                    Політикою конфіденційності
                                  </a>
                                </FormLabel>
                                <FormMessage className="text-xs" />
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Order Summary + Price */}
                        <div className="pt-3 space-y-4">
                          <div className="flex justify-between items-center text-sm text-stone-600 dark:text-stone-400">
                            <span className="truncate pr-4">{itemTitle}</span>
                            {variantTitle && (
                              <span className="shrink-0 font-medium text-stone-900 dark:text-stone-100">
                                {variantTitle}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-end pb-3 border-b-2 border-stone-200 dark:border-stone-800">
                            <span className="text-xs uppercase tracking-[0.15em] font-medium text-stone-500 dark:text-stone-400">
                              До сплати
                            </span>
                            <div className="flex flex-col items-end gap-1">
                              {discount && (
                                <div className="flex items-center gap-2 text-sm font-medium text-stone-400 dark:text-stone-500 line-through decoration-stone-400/50">
                                  <span>{basePrice} ₴</span>
                                  <span className="no-underline px-1.5 py-0.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                                    {discount.label ??
                                      `-${discount.percentage}%`}
                                    {discountDeadline
                                      ? ` ${discountDeadline}`
                                      : ""}
                                  </span>
                                </div>
                              )}
                              <span
                                className={cn(
                                  "text-3xl font-serif font-bold tracking-tight",
                                  discount
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-stone-900 dark:text-stone-50"
                                )}
                              >
                                {finalPrice} ₴
                              </span>
                            </div>
                          </div>

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

                          {/* Submit Button - Compact */}
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
                              onClick={onClose}
                              className="w-full text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors duration-200 py-2"
                            >
                              Скасувати
                            </button>
                          </div>
                        </div>
                      </form>
                    </Form>
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
