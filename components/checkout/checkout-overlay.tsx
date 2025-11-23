"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Check } from "lucide-react";
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
  getNamedCertificateColor,
  SPECIAL_CERTIFICATE_SUBTITLE,
  SPECIAL_CERTIFICATE_COLOR,
  MASTER_CLASS_SUBTITLE,
  MASTER_CLASS_SUBTITLE_COLOR,
} from "@/lib/certificate-config";
import {
  createPaymentInvoice,
  formatPhoneForAPI,
  type CreateInvoiceRequest,
} from "@/lib/api/payments";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Ім'я повинно містити мінімум 2 символи",
  }),
  phone: z.string().min(17, {
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

// Simple phone formatter
const formatPhoneNumber = (value: string) => {
  const phoneNumber = value.replace(/\D/g, "");
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 3) return "+38 (0";
  if (phoneNumberLength < 6) return `+38 (0${phoneNumber.slice(3)}`;
  if (phoneNumberLength < 9)
    return `+38 (0${phoneNumber.slice(3, 5)}) ${phoneNumber.slice(5)}`;
  if (phoneNumberLength < 11)
    return `+38 (0${phoneNumber.slice(3, 5)}) ${phoneNumber.slice(
      5,
      8
    )}-${phoneNumber.slice(8)}`;
  return `+38 (0${phoneNumber.slice(3, 5)}) ${phoneNumber.slice(
    5,
    8
  )}-${phoneNumber.slice(8, 10)}-${phoneNumber.slice(10, 12)}`;
};

export default function CheckoutOverlay({
  isOpen,
  onClose,
  certificate,
  variantId,
}: CheckoutOverlayProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "+38 (0",
      agreement: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      form.reset({
        name: "",
        phone: "+38 (0",
        agreement: false,
      });
    }
  }, [isOpen, form]);

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!certificate) return;

    setIsSubmitting(true);

    try {
      // Determine price and description
      let price = 0;
      let finalDiscount = certificate.discount;
      let orderDescription = certificate.description;

      if (certificate.type === "massage_course") {
        // Find selected variant
        const variant = certificate.variants.find((v) => v.id === variantId);
        if (!variant) throw new Error("Variant not found");

        price = variant.price;
        if (variant.discount) finalDiscount = variant.discount;

        // Format: "Title (Variant Title)"
        orderDescription = `${certificate.description} (${variant.title})`;
      } else {
        price = (certificate as any).price || (certificate as any).denomination;
      }

      // Apply discount
      const finalPrice = finalDiscount
        ? Math.round(price * (1 - finalDiscount.percentage / 100))
        : price;

      // Create invoice request
      const invoiceRequest: CreateInvoiceRequest = {
        amount: finalPrice,
        orderDescription,
        name: values.name,
        phone: formatPhoneForAPI(values.phone),
        regular: "none",
        userId: `cert_${certificate.id}_${variantId || "main"}_${Date.now()}`,
      };

      // Call API to create payment invoice
      const response = await createPaymentInvoice(invoiceRequest);

      // Redirect to payment page
      if (response.data.invoiceUrl) {
        window.location.href = response.data.invoiceUrl;
      } else {
        throw new Error("No invoice URL received");
      }
    } catch (error) {
      console.error("Payment creation failed:", error);
      setIsSubmitting(false);
      // TODO: Show error message to user
      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося створити платіж. Спробуйте ще раз."
      );
    }
  }

  if (!certificate) return null;

  const isCourse = certificate.type === "massage_course";
  const isNamed = certificate.type === "named_gift_certificate";
  const isGift = certificate.type === "gift_certificate";
  const isMasterClass = certificate.type === "master_class";
  const isSpecial = certificate.type === "special";

  // Price Logic
  let price = 0;
  let finalDiscount = certificate.discount;
  let variantTitle = "";

  if (isCourse) {
    const variant = (certificate as any).variants.find(
      (v: any) => v.id === variantId
    );
    if (variant) {
      price = variant.price;
      if (variant.discount) finalDiscount = variant.discount;
      variantTitle =
        variant.sessions === 1 ? "1 сеанс" : `${variant.sessions} сеансів`;
    }
  } else {
    price = (certificate as any).price || (certificate as any).denomination;
  }

  const finalPrice = finalDiscount
    ? Math.round(price * (1 - finalDiscount.percentage / 100))
    : price;

  // Helper to reconstruct visual props
  const getVisualProps = () => {
    if (isCourse) {
      return {
        title: (certificate as any).title,
        subtitle: variantTitle,
      };
    }
    if (isNamed) {
      const themeMatch = (certificate as any).title.match(/(.*?)$/);
      const themeName = themeMatch ? themeMatch[1] : "Premium";
      const themeColor = getNamedCertificateColor(themeName);
      return {
        title: (
          <div className="flex items-center justify-center">
            <span className="text-[3rem] sm:text-[4rem] font-light leading-none">
              {themeName.toUpperCase()}
            </span>
          </div>
        ),
        titleColor: themeColor,
        subtitle: `${(certificate as any).denomination} ₴`,
        className: "bg-stone-100 dark:bg-stone-900",
      };
    }
    if (isGift) {
      return {
        title: (
          <div className="flex items-start justify-center leading-[0.8] -space-x-2 ml-8">
            <span className="text-[6rem] sm:text-[8rem] font-bold tracking-tighter text-stone-900 dark:text-stone-50">
              {(certificate as any).denomination}
            </span>
            <span className="text-2xl sm:text-3xl font-medium text-stone-500 dark:text-stone-400 mt-4 sm:mt-6 tracking-widest">
              UAH
            </span>
          </div>
        ),
      };
    }
    if (isMasterClass) {
      return {
        title: (certificate as any).title,
        subtitle: MASTER_CLASS_SUBTITLE,
        subtitleColor: MASTER_CLASS_SUBTITLE_COLOR,
      };
    }
    if (isSpecial) {
      return {
        title: (certificate as any).title.toUpperCase(),
        titleColor: SPECIAL_CERTIFICATE_COLOR,
        subtitle: SPECIAL_CERTIFICATE_SUBTITLE,
      };
    }
    return { title: "" };
  };

  const visualProps = getVisualProps();

  return (
    <AnimatePresence>
      {isOpen && (
        <RemoveScroll>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center sm:items-center sm:justify-center"
          >
            {/* Enhanced Backdrop with gradient vignette */}
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-linear-to-br from-stone-900/30 via-stone-900/20 to-black/40 dark:from-black/70 dark:via-black/60 dark:to-black/80"
              onClick={onClose}
            />

            {/* Main Container - Redesigned Layout */}
            <div
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
                className="relative w-[85%] sm:w-[80%] max-w-[550px] -mb-12 sm:-mb-16 z-20"
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
                <div className="flex-1 overflow-y-auto pt-20 sm:pt-24 pb-6 px-6 sm:px-6">
                  <AnimatePresence mode="wait">
                    {!isSuccess ? (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.15, duration: 0.5 }}
                        className="space-y-5"
                      >
                        {/* Premium Header - Compact */}
                        <div className="space-y-1.5 pb-4 border-b border-stone-200/60 dark:border-stone-800/60">
                          <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-50 tracking-tight">
                            Оформлення
                          </h2>
                          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                            Заповніть дані для отримання сертифікату
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
                                      placeholder="+38 (0__) ___-__-__"
                                      className="h-12 text-base font-mono bg-stone-50/80 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl px-5 focus-visible:ring-2 focus-visible:ring-stone-400 dark:focus-visible:ring-stone-600 focus-visible:border-transparent transition-all duration-300 hover:border-stone-300 dark:hover:border-stone-600 placeholder:text-stone-400 dark:placeholder:text-stone-600"
                                      onChange={(e) => {
                                        const formatted = formatPhoneNumber(
                                          e.target.value
                                        );
                                        field.onChange(formatted);
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

                            {/* Price Section - Compact */}
                            <div className="pt-3 space-y-4">
                              <div className="flex justify-between items-end pb-3 border-b-2 border-stone-200 dark:border-stone-800">
                                <span className="text-xs uppercase tracking-[0.15em] font-medium text-stone-500 dark:text-stone-400">
                                  До сплати
                                </span>
                                <div className="flex flex-col items-end gap-1">
                                  {finalDiscount && (
                                    <div className="flex items-center gap-2 text-sm font-medium text-stone-400 dark:text-stone-500 line-through decoration-stone-400/50">
                                      <span>{price} ₴</span>
                                      <span className="no-underline px-1.5 py-0.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                                        -{finalDiscount.percentage}%
                                      </span>
                                    </div>
                                  )}
                                  <span
                                    className={cn(
                                      "text-3xl font-serif font-bold tracking-tight",
                                      finalDiscount
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-stone-900 dark:text-stone-50"
                                    )}
                                  >
                                    {finalPrice} ₴
                                  </span>
                                </div>
                              </div>

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
                    ) : (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          type: "spring",
                          damping: 20,
                          stiffness: 300,
                        }}
                        className="flex flex-col items-center justify-center py-16 text-center space-y-8"
                      >
                        {/* Success Icon with Animation */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            damping: 15,
                            stiffness: 400,
                            delay: 0.1,
                          }}
                          className="relative"
                        >
                          <div className="w-24 h-24 rounded-full bg-linear-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20 flex items-center justify-center shadow-xl shadow-green-500/10 ring-1 ring-green-500/20">
                            <Check className="w-10 h-10 text-green-600 dark:text-green-400 stroke-3" />
                          </div>
                          {/* Decorative ring */}
                          <div className="absolute inset-0 rounded-full border-2 border-green-500/20 animate-ping" />
                        </motion.div>

                        {/* Success Message */}
                        <div className="space-y-4 max-w-sm">
                          <h3 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50 tracking-tight">
                            Дякуємо!
                          </h3>
                          <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed px-4">
                            Ми надішлемо деталі вашого замовлення на вказаний
                            номер телефону найближчим часом.
                          </p>
                        </div>

                        {/* Close Button */}
                        <Button
                          onClick={onClose}
                          variant="outline"
                          className="min-w-[200px] h-12 rounded-2xl border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300 font-medium"
                        >
                          Закрити
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </RemoveScroll>
      )}
    </AnimatePresence>
  );
}
