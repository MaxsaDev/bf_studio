"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MarqueeProps {
  text: string;
  direction?: "left" | "right";
  speed?: number;
  className?: string;
}

export function Marquee({
  text,
  direction = "left",
  speed = 30,
  className,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "relative flex overflow-hidden whitespace-nowrap py-6 select-none",
        className
      )}
    >
      <motion.div
        className="flex gap-12"
        animate={{
          x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          duration: speed,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {/* Duplicate text enough times to ensure seamless loop */}
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="text-5xl sm:text-7xl font-bold font-serif uppercase tracking-tighter opacity-[0.06] text-stone-900 dark:text-stone-100 leading-none"
          >
            {text} <span className="opacity-50 mx-4">•</span>
          </span>
        ))}
      </motion.div>

      {/* Gradient Fade Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-stone-100 to-transparent dark:from-stone-900 z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-stone-100 to-transparent dark:from-stone-900 z-10" />
    </div>
  );
}
