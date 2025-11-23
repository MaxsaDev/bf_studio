"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function ScrollBlur() {
  const { scrollY } = useScroll();

  // Create a dynamic mask-image using CSS gradients
  // As we scroll, the top/bottom fade gets stronger or weaker depending on needs.
  // Actually, "Depth of Field" often means blurring things that are far away (top/bottom of viewport).
  // A simple static backdrop-filter gradient works best for performance:
  // Blur at extreme top and bottom, clear in middle.

  return (
    <>
      {/* Top Blur */}
      <div className="fixed top-0 left-0 right-0 h-32 z-40 pointer-events-none backdrop-blur-[2px] mask-linear-to-b"
           style={{
             maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
             WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)"
           }}
      />

      {/* Bottom Blur */}
      <div className="fixed bottom-0 left-0 right-0 h-32 z-40 pointer-events-none backdrop-blur-[2px] mask-linear-to-t"
           style={{
             maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
             WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)"
           }}
      />
    </>
  );
}

