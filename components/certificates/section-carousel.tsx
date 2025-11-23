"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Certificate } from "@/types/certificate";
// Dynamic import for CertificateCard - slightly delays rendering of off-screen or heavy card content
const CertificateCard = dynamic(
  () => import("./certificate-card").then((mod) => mod.CertificateCard),
  {
    loading: () => (
      <div className="w-full h-full bg-stone-100 dark:bg-stone-800 animate-pulse rounded-xl" />
    ),
    ssr: true, // Keep SSR for SEO on initial load, but hydrate lazily if possible
  }
);
import { cn } from "@/lib/utils";

interface SectionCarouselProps {
  title?: string; // Optional now as we use external header
  certificates: Certificate[];
  onSelect?: (
    certificate: Certificate,
    mode?: "fullCourse" | "session"
  ) => void;
}

const DRAG_BUFFER = 50;

export function SectionCarousel({
  title,
  certificates,
  onSelect,
}: SectionCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleDragEnd = (e: any, { offset }: any) => {
    const swipe = Math.abs(offset.x) > DRAG_BUFFER;
    const dir = offset.x < 0 ? 1 : -1;

    if (swipe) {
      if (dir === 1) {
        scrollNext();
      } else {
        scrollPrev();
      }
    }
  };

  const scrollPrev = useCallback(() => {
    setActiveIndex(
      (prev) => (prev - 1 + certificates.length) % certificates.length
    );
  }, [certificates.length]);

  const scrollNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % certificates.length);
  }, [certificates.length]);

  return (
    <div
      className="w-full py-0 md:py-4 space-y-8 overflow-hidden relative focus-visible:outline-none group/carousel"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") scrollPrev();
        if (e.key === "ArrowRight") scrollNext();
      }}
    >
      {/* Navigation Controls - Re-positioned */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-60 pointer-events-none flex justify-between px-2 md:px-12 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollPrev}
          className="pointer-events-auto rounded-full h-12 w-12 md:h-14 md:w-14 bg-white/80 dark:bg-black/40 backdrop-blur-md border border-stone-200/50 dark:border-stone-800/50 hover:scale-110 transition-all shadow-sm"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 text-stone-800 dark:text-stone-200" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollNext}
          className="pointer-events-auto rounded-full h-12 w-12 md:h-14 md:w-14 bg-white/80 dark:bg-black/40 backdrop-blur-md border border-stone-200/50 dark:border-stone-800/50 hover:scale-110 transition-all shadow-sm"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 text-stone-800 dark:text-stone-200" />
        </Button>
      </div>

      <div className="relative h-[600px] sm:h-[750px] w-full flex items-center justify-center perspective-1000">
        <AnimatePresence mode="popLayout">
          {certificates.map((cert, i) => {
            const length = certificates.length;
            let offset = i - activeIndex;

            if (offset > length / 2) offset -= length;
            if (offset < -length / 2) offset += length;

            const absOffset = Math.abs(offset);

            // Only render visible cards
            if (absOffset > 2) return null;

            return (
              <CardItem
                key={cert.id}
                certificate={cert}
                offset={offset}
                onSelect={onSelect}
                onDragEnd={handleDragEnd}
                isActive={i === activeIndex}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mobile pagination */}
      <div className="flex justify-center gap-2 mt-0 md:hidden z-20 relative">
        {certificates.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === activeIndex
                ? "w-8 bg-stone-900 dark:bg-stone-100"
                : "w-1.5 bg-stone-300 dark:bg-stone-700"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

interface CardItemProps {
  certificate: Certificate;
  offset: number;
  onSelect?: (
    certificate: Certificate,
    mode?: "fullCourse" | "session"
  ) => void;
  onDragEnd: (e: any, info: any) => void;
  isActive: boolean;
}

const CardItem = React.memo(function CardItem({
  certificate,
  offset,
  onSelect,
  onDragEnd,
  isActive,
}: CardItemProps) {
  const absOffset = Math.abs(offset);

  // Cinematic Deck Physics
  const zIndex = 50 - absOffset;
  const scale = 1 - absOffset * 0.08;

  const rotateY = offset * -8;
  const rotateZ = offset * 2;
  const x = `${offset * 60}%`;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={onDragEnd}
      initial={false}
      animate={{
        x,
        scale,
        zIndex,
        opacity: isActive ? 1 : 0.9,
        rotateY,
        rotateZ,
        filter: isActive
          ? "blur(0px) brightness(1)"
          : "blur(3px) brightness(0.95)",
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className={cn(
        "absolute w-[85%] md:w-[650px] cursor-grab active:cursor-grabbing top-1/2 -translate-y-1/2 left-[7.5%] md:left-[calc(50%-325px)] will-change-transform",
        !isActive && "pointer-events-none"
      )}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {/* Pass isActive down to control controls visibility */}
      <CertificateCard
        certificate={certificate}
        onSelect={(certificate, variantId) =>
          onSelect?.(certificate, variantId as "fullCourse" | "session")
        }
        isActive={isActive}
      />
    </motion.div>
  );
});
