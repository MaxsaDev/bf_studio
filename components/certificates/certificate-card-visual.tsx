"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { CSSProperties, ReactNode, useRef } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { CERTIFICATE_IMAGE } from "@/lib/certificate-config";

/** An add-on sticker shown on the card face */
export interface CardSticker {
  id: string;
  icon: string;
  label: string;
  qty: number;
}

/**
 * Sticker placement from the brief: three per column, left and right of the
 * title. Filled alternately so any selection stays balanced. Percentages are
 * relative to the card box, so the layout scales with it.
 */
const STICKER_SLOTS: ReadonlyArray<{ side: "left" | "right"; top: string }> = [
  { side: "left", top: "15%" },
  { side: "right", top: "15%" },
  { side: "left", top: "38.5%" },
  { side: "right", top: "38.5%" },
  { side: "left", top: "62%" },
  { side: "right", top: "62%" },
];

function CardStickers({ stickers }: { stickers: CardSticker[] }) {
  return (
    <div
      className="absolute inset-0 z-30 pointer-events-none"
      style={{ transform: "translateZ(40px)" }}
      aria-hidden
    >
      <AnimatePresence>
        {stickers.slice(0, STICKER_SLOTS.length).map((sticker, i) => {
          const slot = STICKER_SLOTS[i];
          const position: CSSProperties =
            slot.side === "left"
              ? { top: slot.top, left: "3.5%" }
              : { top: slot.top, right: "3.5%" };

          return (
            <motion.div
              key={sticker.id}
              layout
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="absolute aspect-square w-[9%] rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.14)]"
              style={position}
            >
              <Image
                src={sticker.icon}
                alt=""
                fill
                unoptimized
                sizes="64px"
                className="p-[2%]"
              />
              {sticker.qty > 1 && (
                <span className="absolute -bottom-[6%] -right-[6%] flex h-[42%] min-w-[42%] items-center justify-center rounded-full bg-stone-900 px-[8%] text-[9px] sm:text-[11px] font-bold leading-none text-white ring-2 ring-white">
                  {sticker.qty}
                </span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

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
  /** Preload the background image — set only for the initially visible card */
  imagePriority?: boolean;
  /**
   * Add-on stickers to show beside the title. Pass an array (even empty) to
   * reserve the side columns so the title does not jump when the first
   * sticker appears; leave undefined on carousel cards.
   */
  stickers?: CardSticker[];
}

export function CertificateCardVisual({
  title,
  titleColor,
  subtitle,
  subtitleColor,
  description,
  imageSrc = CERTIFICATE_IMAGE,
  className,
  layoutId,
  isDark = false,
  imagePriority = false,
  stickers,
}: CertificateCardVisualProps) {
  const hasStickerArea = stickers !== undefined;
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

  // Foil sheen movement — hooks must stay unconditional even though the
  // layer itself only renders for light cards
  const sheenX = useTransform(mouseXSpring, [-0.5, 0.5], ["-100%", "100%"]);
  const sheenOpacity = useTransform(mouseXSpring, (v) => Math.abs(v) * 0.5);

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
            priority={imagePriority}
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
            x: sheenX,
            opacity: sheenOpacity,
          }}
          className="absolute inset-0 z-20 pointer-events-none mix-blend-soft-light"
        />
      )}

      {/* Content Layer - Floats above */}
      <motion.div
        style={{ transform: "translateZ(40px)" }} // Actual 3D push
        className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-30"
      >
        <div
          className={cn(
            "space-y-3 mx-auto",
            hasStickerArea ? "max-w-[74%]" : "max-w-[85%]"
          )}
        >
          {/* Enhanced Title Contrast */}
          <div
            className={cn(
              "font-sans font-bold tracking-tight leading-tight drop-shadow-sm text-balance",
              !titleColor &&
                (isDark
                  ? "text-stone-100"
                  : "text-stone-900 dark:text-stone-100"),
              typeof title === "string"
                ? hasStickerArea
                  ? "text-lg sm:text-3xl"
                  : "text-2xl sm:text-4xl"
                : ""
            )}
            style={titleColor ? { color: titleColor } : undefined}
          >
            {title}
          </div>

          {(subtitle || description) && (
            <div
              className={cn(
                "flex items-center justify-center mt-3 opacity-90 gap-2 sm:gap-4"
              )}
            >
              <span
                className={cn(
                  "h-px w-4 sm:w-8",
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
                  "h-px w-4 sm:w-8",
                  isDark
                    ? "bg-stone-100/20"
                    : "bg-stone-900/20 dark:bg-stone-100/20"
                )}
              ></span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add-on stickers: three per side, flanking the title */}
      {stickers && stickers.length > 0 && <CardStickers stickers={stickers} />}

      {/* Premium Border/Sheen */}
      <div className="absolute inset-0 border border-stone-900/5 dark:border-white/10 rounded-xl pointer-events-none ring-1 ring-inset ring-white/20 dark:ring-black/10 z-40" />
    </motion.div>
  );
}
