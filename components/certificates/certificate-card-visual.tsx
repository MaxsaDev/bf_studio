"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { ReactNode, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface CertificateCardVisualProps {
  title: ReactNode;
  titleColor?: string;
  subtitle?: ReactNode;
  subtitleColor?: string;
  description?: string;
  imageSrc?: string;
  className?: string;
  layoutId?: string;
  isDark?: boolean;
}

export function CertificateCardVisual({
  title,
  titleColor,
  subtitle,
  subtitleColor,
  description,
  imageSrc = "/template.jpg",
  className,
  layoutId,
  isDark = false,
}: CertificateCardVisualProps) {
  // Tilt Logic
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  // Holographic glare movement
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    // Disable tilt on touch devices/small screens
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      layoutId={layoutId}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
      }}
      className={cn(
        "relative aspect-1115/700 w-full rounded-xl overflow-hidden transition-shadow duration-300",
        isDark
          ? "shadow-2xl shadow-black/40" // Strong dark shadow for black cards
          : "shadow-xl shadow-stone-200/50 dark:shadow-black/50", // Standard shadow for light cards
        "bg-[#F5F5F4] dark:bg-[#1C1917]", // Fallback color
        className
      )}
    >
      {/* Content Container - Pushed back slightly for depth */}
      <div
        className="absolute inset-0"
        style={{ transform: "translateZ(0px)" }}
      >
        {/* Background Image */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <Image
            src={imageSrc}
            alt="Certificate Background"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 95vw, 500px"
            priority
          />
        </div>

        {/* Texture / Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay bg-[url('/noise.svg')] bg-repeat" />

        {/* Stronger Overlay for Contrast */}
        <div
          className={cn(
            "absolute inset-0 bg-linear-to-b",
            isDark
              ? "from-black/60 via-transparent to-black/60" // Dark mode vignette
              : "from-white/40 via-white/10 to-white/50 dark:from-black/10 dark:via-black/0 dark:to-black/40" // Light mode fog
          )}
        />

        {/* Additional subtle radial for center focus */}
        <div
          className={cn(
            "absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.4)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-60",
            isDark && "bg-none opacity-0" // Disable white fog for dark cards
          )}
        />
      </div>

      {/* Holographic Foil / Glare Layer */}
      {!isDark && (
        <motion.div
          style={{
            background: `radial-gradient(
              circle at ${glareX} ${glareY},
              rgba(255,255,255,0.2) 0%,
              rgba(255,255,255,0.1) 20%,
              transparent 60%
           )`,
            mixBlendMode: "overlay",
            opacity: 0.8,
          }}
          className="absolute inset-0 z-20 pointer-events-none"
        />
      )}

      {/* Subtle Rainbow Sheen for "Foil" effect */}
      {!isDark && (
        <motion.div
          style={{
            background: `linear-gradient(
               115deg,
               transparent 30%,
               rgba(255,255,255,0.1) 45%,
               rgba(255,255,255,0.2) 50%,
               rgba(255,255,255,0.1) 55%,
               transparent 70%
            )`,
            x: useTransform(mouseXSpring, [-0.5, 0.5], ["-100%", "100%"]),
            opacity: useTransform(mouseXSpring, (v) => Math.abs(v) * 0.5),
          }}
          className="absolute inset-0 z-20 pointer-events-none mix-blend-soft-light"
        />
      )}

      {/* Content Layer - Floats above */}
      <motion.div
        style={{ transform: "translateZ(40px)" }} // Actual 3D push
        className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-30"
      >
        <div className="space-y-3 max-w-[85%] mx-auto">
          {/* Enhanced Title Contrast */}
          <div
            className={cn(
              "font-sans font-bold tracking-tight leading-tight drop-shadow-sm text-balance",
              !titleColor &&
                (isDark
                  ? "text-stone-100"
                  : "text-stone-900 dark:text-stone-100"),
              typeof title === "string" ? "text-2xl sm:text-4xl" : ""
            )}
            style={titleColor ? { color: titleColor } : undefined}
          >
            {title}
          </div>

          {(subtitle || description) && (
            <div className="flex items-center justify-center gap-4 mt-3 opacity-90">
              <span
                className={cn(
                  "h-px w-8",
                  isDark
                    ? "bg-stone-100/20"
                    : "bg-stone-900/20 dark:bg-stone-100/20"
                )}
              ></span>
              <div
                className={cn(
                  "font-sans text-xs sm:text-sm tracking-[0.2em] uppercase font-bold",
                  !subtitleColor &&
                    (isDark
                      ? "text-stone-200"
                      : "text-stone-800 dark:text-stone-200")
                )}
                style={subtitleColor ? { color: subtitleColor } : undefined}
              >
                {subtitle || description}
              </div>
              <span
                className={cn(
                  "h-px w-8",
                  isDark
                    ? "bg-stone-100/20"
                    : "bg-stone-900/20 dark:bg-stone-100/20"
                )}
              ></span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Premium Border/Sheen */}
      <div className="absolute inset-0 border border-stone-900/5 dark:border-white/10 rounded-xl pointer-events-none ring-1 ring-inset ring-white/20 dark:ring-black/10 z-40" />
    </motion.div>
  );
}
