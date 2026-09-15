"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CursorSpotlight() {
  // Only mount the (600px, blur-50px — GPU-heavy) layer for fine pointers.
  // Starts false on both server and client, so hydration is unaffected.
  const [enabled, setEnabled] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for the spotlight
  const springX = useSpring(mouseX, { stiffness: 150, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 30 });

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enabled, mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-50 mix-blend-screen dark:mix-blend-overlay will-change-transform"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
      }}
    >
      {/* Main Spotlight */}
      <div className="w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)] blur-[50px]" />
    </motion.div>
  );
}
