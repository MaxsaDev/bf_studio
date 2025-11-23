"use client";

import { useState } from "react";
import { certificates } from "@/data/certificates";
import Link from "next/link";
import { SectionCarousel } from "@/components/certificates/section-carousel";
import dynamic from "next/dynamic";
import { Certificate } from "@/types/certificate";
import { motion } from "framer-motion";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { SectionHeader } from "@/components/layout/section-header";
import { Marquee } from "@/components/ui/marquee";
import { FloatingNav } from "@/components/layout/floating-nav";
import { SplashScreen } from "@/components/layout/splash-screen";
import { ScrollBlur } from "@/components/layout/scroll-blur";
import { CursorSpotlight } from "@/components/layout/cursor-spotlight";
import { siteConfig } from "@/lib/site-config";

const CheckoutOverlay = dynamic(
  () => import("@/components/checkout/checkout-overlay"),
  {
    ssr: false,
  }
);

export default function Home() {
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleSelect = (certificate: Certificate, variantId?: string) => {
    setSelectedCertificate(certificate);
    setSelectedVariantId(variantId || null);
    setIsCheckoutOpen(true);
  };

  // Group certificates
  const massageCourses = certificates.filter(
    (c) => c.type === "massage_course"
  );
  const specialCertificates = certificates.filter((c) => c.type === "special");
  const namedCertificates = certificates.filter(
    (c) => c.type === "named_gift_certificate"
  );
  const giftCertificates = certificates.filter(
    (c) => c.type === "gift_certificate"
  );
  const masterClasses = certificates.filter((c) => c.type === "master_class");

  return (
    <main className="min-h-screen w-full bg-background text-foreground selection:bg-stone-200 dark:selection:bg-stone-800 overflow-x-hidden relative scroll-smooth">
      <SplashScreen />
      <AmbientBackground />
      <CursorSpotlight />
      <ScrollBlur />
      <FloatingNav />

      <div className="relative z-10">
        {/* Large Cinematic Header */}
        <header className="h-[50vh] min-h-[400px] flex flex-col items-center justify-center text-center px-6 relative border-b border-stone-200/50 dark:border-stone-800/50 overflow-hidden">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.2, delayChildren: 2.4 },
              },
            }}
            className="space-y-8 relative z-10"
          >
            <div className="overflow-hidden">
              <motion.p
                variants={{
                  hidden: { y: "100%" },
                  visible: {
                    y: 0,
                    transition: { duration: 0.6, ease: "circOut" },
                  },
                }}
                className="text-xs font-bold tracking-[0.3em] text-stone-500 uppercase"
              >
                The Collection
              </motion.p>
            </div>

            <div className="overflow-hidden px-4">
              <motion.h1
                variants={{
                  hidden: { y: "100%", opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                className="text-5xl sm:text-8xl md:text-9xl font-serif font-bold tracking-tighter text-stone-900 dark:text-stone-100 leading-[1.1] pb-2"
              >
                {siteConfig.business.name.toUpperCase()}
              </motion.h1>
            </div>

            <div className="overflow-hidden">
              <motion.p
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: { duration: 0.8, ease: "easeOut" },
                  },
                }}
                className="text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed"
              >
                Подаруйте справжню турботу про тіло та емоції, обравши вишуканий
                подарунок для тих, кого любите.
              </motion.p>
            </div>
          </motion.div>

          {/* Decorative vertical line */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "100px" }}
            transition={{ delay: 3, duration: 1.5, ease: "easeInOut" }}
            className="absolute bottom-0 w-px bg-stone-300 dark:bg-stone-800"
          />
        </header>

        <div className="pb-32">
          {/* Section 1: Courses */}
          <section id="courses" className="py-12">
            <SectionHeader
              index="01"
              title="Курси масажу"
              description="Комплексні оздоровчі програми, розроблені для довгострокового покращення здоров'я та глибокого розслаблення."
            />
            <SectionCarousel
              certificates={massageCourses}
              onSelect={handleSelect}
            />
          </section>

          {/* Marquee Break */}
          <div className="py-12 opacity-40 pointer-events-none">
            <Marquee
              text="Оздоровлення • Ритуал • Гармонія • Баланс"
              speed={40}
            />
          </div>

          {/* Section 2: Special */}
          <section id="special" className="py-12">
            <SectionHeader
              index="02"
              title="Особливі сеанси"
              description="Ексклюзивні масажні сеанси для особливих моментів. Створіть незабутні спогади разом."
            />
            <SectionCarousel
              certificates={specialCertificates}
              onSelect={handleSelect}
            />
          </section>

          {/* Marquee Break */}
          <div className="py-12 opacity-40 pointer-events-none">
            <Marquee
              text="Романтика • Розкіш • Незабутні враження"
              direction="right"
              speed={42}
            />
          </div>

          {/* Section 3: Named */}
          <section id="named" className="py-12">
            <SectionHeader
              index="03"
              title="Колекція дорогоцінного каміння"
              description="Ексклюзивна колекція іменних подарунків преміального рівня, де кожен номінал сяє неповторною красою та величчю дорогоцінного каміння."
            />
            <SectionCarousel
              certificates={namedCertificates}
              onSelect={handleSelect}
            />
          </section>

          {/* Marquee Break Reverse */}
          <div className="py-12 opacity-40 pointer-events-none">
            <Marquee
              text="Подаруйте відчуття • BODY FACTORY • Львів"
              direction="right"
              speed={35}
            />
          </div>

          {/* Section 4: Gift */}
          <section id="gift" className="py-12">
            <SectionHeader
              index="04"
              title="На подарунок"
              description="Гнучкі номінали для будь-якої нагоди. Ідеальний спосіб сказати, що вам не байдуже."
            />
            <SectionCarousel
              certificates={giftCertificates}
              onSelect={handleSelect}
            />
          </section>

          {/* Marquee Break */}
          <div className="py-12 opacity-40 pointer-events-none">
            <Marquee
              text="Навчіться мистецтву масажу • BODY FACTORY"
              speed={38}
            />
          </div>

          {/* Section 5: Master Classes */}
          <section id="masterclass" className="py-12">
            <SectionHeader
              index="05"
              title="Майстер класи"
              description="Опануйте техніки професійного масажу під керівництвом досвідчених майстрів."
            />
            <SectionCarousel
              certificates={masterClasses}
              onSelect={handleSelect}
            />
          </section>
        </div>
      </div>

      <CheckoutOverlay
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        certificate={selectedCertificate}
        variantId={selectedVariantId}
      />

      {/* Footer */}
      <footer className="py-24 border-t border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-black/20 backdrop-blur-lg text-center text-stone-400 dark:text-stone-600 text-sm relative z-10">
        <div className="space-y-6">
          <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-100">
            {siteConfig.business.name}
          </h2>
          <div className="flex justify-center gap-8 text-xs uppercase tracking-widest">
            <Link
              href={siteConfig.legal.agreement.path}
              className="hover:text-stone-900 dark:hover:text-stone-300 transition-colors"
            >
              {siteConfig.legal.agreement.title}
            </Link>
            <Link
              href={siteConfig.legal.privacy.path}
              className="hover:text-stone-900 dark:hover:text-stone-300 transition-colors"
            >
              {siteConfig.legal.privacy.title}
            </Link>
          </div>
          <p>© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
