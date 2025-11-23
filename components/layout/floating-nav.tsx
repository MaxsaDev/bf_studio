"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Hand, Gem, Gift, Presentation, Sparkles } from "lucide-react";

export function FloatingNav() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/90 dark:bg-[#1C1917]/90 backdrop-blur-xl border border-stone-200 dark:border-stone-800 rounded-full p-1.5 shadow-2xl shadow-stone-900/10 flex gap-1"
    >
      <NavButton
        icon={<Hand className="w-4 h-4" />}
        label="Курси"
        onClick={() => scrollTo("courses")}
      />
      <NavButton
        icon={<Sparkles className="w-4 h-4" />}
        label="Особливі"
        onClick={() => scrollTo("special")}
      />
      <NavButton
        icon={<Gem className="w-4 h-4" />}
        label="Іменні"
        onClick={() => scrollTo("named")}
      />
      <NavButton
        icon={<Gift className="w-4 h-4" />}
        label="Подарунок"
        onClick={() => scrollTo("gift")}
      />
      <NavButton
        icon={<Presentation className="w-4 h-4" />}
        label="Майстер клас"
        onClick={() => scrollTo("masterclass")}
      />
    </motion.div>
  );
}

function NavButton({ icon, label, onClick }: any) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 gap-2 px-4 h-10 transition-all active:scale-95"
    >
      {icon}
      <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
        {label}
      </span>
    </Button>
  );
}
