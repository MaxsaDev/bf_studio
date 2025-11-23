"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, ArrowRight, Phone, Mail } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export default function SuccessPaymentPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-amber-200/20 dark:bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          {/* Success card */}
          <div className="bg-white dark:bg-stone-950 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {/* Header with gradient */}
            <div className="relative bg-linear-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/30 dark:to-amber-950/30 p-12 text-center border-b border-stone-200 dark:border-stone-800">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-emerald-500 dark:bg-emerald-600 rounded-full mb-6 shadow-lg"
              >
                <CheckCircle2
                  className="w-12 h-12 text-white"
                  strokeWidth={2.5}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-3">
                  {siteConfig.successPage.title}
                </h1>
                <p className="text-lg text-stone-600 dark:text-stone-400 max-w-md mx-auto">
                  {siteConfig.successPage.subtitle}
                </p>
              </motion.div>

              {/* Decorative sparkles */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute top-8 right-8"
              >
                <Sparkles className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="absolute bottom-8 left-8"
              >
                <Sparkles className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              </motion.div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-8 md:p-12"
            >
              {/* Next steps */}
              <div className="mb-8">
                <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-4">
                  Що далі?
                </h2>
                <div className="space-y-4">
                  {siteConfig.successPage.steps.map((step) => (
                    <div key={step.number} className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center text-sm font-medium text-stone-700 dark:text-stone-300">
                        {step.number}
                      </div>
                      <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important note */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-6 mb-8 relative overflow-hidden">
                {siteConfig.certificate.validity.isPromotion && (
                  <div className="absolute -top-4 -right-4 opacity-10">
                    <Sparkles className="w-24 h-24 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
                <div className="relative z-10">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                    {siteConfig.certificate.validity.isPromotion ? (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        {siteConfig.certificate.validity.promotionLabel}
                      </>
                    ) : (
                      "Важлива інформація"
                    )}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
                    {siteConfig.certificate.validity.isPromotion
                      ? siteConfig.certificate.validity.promotionNote
                      : siteConfig.certificate.validity.note}
                  </p>
                </div>
              </div>

              {/* Contact info */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-800">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 dark:text-stone-500 mb-1">
                      Телефон
                    </p>
                    <a
                      href={siteConfig.contact.phone.href}
                      className="text-sm font-medium text-stone-900 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                    >
                      {siteConfig.contact.phone.display}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-800">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 dark:text-stone-500 mb-1">
                      Instagram
                    </p>
                    <a
                      href={siteConfig.contact.instagram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-stone-900 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                    >
                      {siteConfig.contact.instagram.handle}
                    </a>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <Link href="/">
                <Button
                  size="lg"
                  className="w-full bg-stone-900 hover:bg-stone-800 dark:bg-stone-50 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 font-medium transition-all duration-300 group"
                >
                  Повернутися на головну
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-stone-500 dark:text-stone-500 mt-8"
          >
            {siteConfig.successPage.footerNote}
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}
