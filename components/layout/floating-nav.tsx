"use client";

import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Hand, Gem, Gift, Presentation, Sparkles } from "lucide-react";

const NAV_SECTIONS = [
  { id: "courses", label: "Курси", icon: Hand },
  { id: "special", label: "Особливі", icon: Sparkles },
  { id: "named", label: "Іменні", icon: Gem },
  { id: "gift", label: "Подарунок", icon: Gift },
  { id: "masterclass", label: "Майстер клас", icon: Presentation },
] as const;

export function FloatingNav() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Scroll spy: highlight the section currently in the middle of the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );

    for (const section of NAV_SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
      aria-label="Розділи сертифікатів"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/90 dark:bg-[#1C1917]/90 backdrop-blur-xl border border-stone-200 dark:border-stone-800 rounded-full p-1.5 shadow-2xl shadow-stone-900/10 flex gap-1"
    >
      {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
        <NavButton
          key={id}
          icon={<Icon className="w-4 h-4" />}
          label={label}
          isActive={activeSection === id}
          onClick={() => scrollTo(id)}
        />
      ))}
    </motion.nav>
  );
}

interface NavButtonProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "rounded-full gap-2 px-4 h-10 transition-all active:scale-95",
        isActive
          ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
      )}
    >
      {icon}
      <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
        {label}
      </span>
    </Button>
  );
}
