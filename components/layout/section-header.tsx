"use client";

import { motion } from "framer-motion";

interface SectionHeaderProps {
  index: string;
  title: string;
  description: string;
  id?: string;
}

export function SectionHeader({
  index,
  title,
  description,
  id,
}: SectionHeaderProps) {
  return (
    <div
      id={id}
      className="max-w-7xl mx-auto px-6 md:px-8 mb-4 relative z-10 pt-16 scroll-mt-20"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 relative">
        {/* Animated Divider Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 left-0 right-0 h-px bg-stone-200 dark:bg-stone-800 origin-left"
        />

        <div className="relative overflow-hidden">
          <motion.span
            initial={{ y: "100%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "circOut" }}
            className="text-xs font-bold tracking-[0.2em] text-stone-400 dark:text-stone-600 mb-3 block font-sans"
          >
            {index}
          </motion.span>

          <div className="overflow-hidden px-1 pb-2">
            <motion.h2
              initial={{ y: "100%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1,
              }}
              className="text-4xl md:text-6xl font-serif font-medium text-stone-900 dark:text-stone-100 leading-[1.1]"
            >
              {title}
            </motion.h2>
          </div>
        </div>

        <div className="overflow-hidden">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            viewport={{ once: true }}
            className="max-w-sm text-sm md:text-base text-stone-500 dark:text-stone-400 leading-relaxed font-sans"
          >
            {description}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
