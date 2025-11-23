"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AMBIENT_CONFIG } from "@/lib/theme-config";

function FloatingParticle({ delay = 0, xRange = 50, yRange = 50, size = 4 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        y: [0, -yRange, 0],
        x: [0, xRange, 0],
      }}
      transition={{
        duration: 10 + Math.random() * 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
      className="absolute rounded-full bg-stone-400/30 dark:bg-stone-500/30 blur-[1px]"
      style={{
        width: size,
        height: size,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
    />
  );
}

function FloatingIcon({
  delay = 0,
  src,
  emoji,
  size = 24,
  depth = "back", // "back" or "front"
}: {
  delay?: number;
  src?: string;
  emoji?: string;
  size?: number;
  depth?: "back" | "front";
}) {
  // Randomize movement slightly
  const yMove = -50 - Math.random() * 100;
  const xMove = (Math.random() - 0.5) * 100;

  // Front layer moves faster for parallax effect
  const duration =
    depth === "front" ? 20 + Math.random() * 10 : 35 + Math.random() * 15;
  const scale = depth === "front" ? [0.8, 1.2, 0.8] : 0.8;

  return (
    <motion.div
      initial={{ opacity: 0, scale: depth === "front" ? 0.8 : 0.6 }}
      animate={{
        opacity: depth === "front" ? [0, 0.8, 0] : [0, 0.4, 0],
        y: [0, yMove, 0],
        x: [0, xMove, 0],
        rotate: [0, 10, -10, 0],
        scale: scale,
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
      className={`absolute pointer-events-none select-none mix-blend-multiply dark:mix-blend-screen ${
        depth === "front" ? "z-50" : "z-0"
      }`}
      style={{
        left: `${Math.random() * 90 + 5}%`,
        top: `${Math.random() * 90 + 5}%`,
        filter: depth === "front" ? "blur(0px)" : "blur(1.5px)", // Blur background items
      }}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt=""
          style={{ width: size, height: "auto" }}
          className={
            depth === "front" ? "opacity-90 drop-shadow-lg" : "opacity-60"
          }
        />
      ) : (
        <span
          style={{ fontSize: size }}
          className={
            depth === "front" ? "opacity-80 drop-shadow-md" : "opacity-50"
          }
        >
          {emoji}
        </span>
      )}
    </motion.div>
  );
}

export function AmbientBackground() {
  // Hydration safe random particles
  const [particles, setParticles] = useState<number[]>([]);
  const [bgIcons, setBgIcons] = useState<any[]>([]);
  const [fgIcons, setFgIcons] = useState<any[]>([]);

  useEffect(() => {
    // Reduce particle count for performance
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const particleCount = isMobile
      ? AMBIENT_CONFIG.particles.mobile
      : AMBIENT_CONFIG.particles.desktop;

    setParticles(Array.from({ length: particleCount }, (_, i) => i));

    // Background layer (slower, blurrier)
    setBgIcons(AMBIENT_CONFIG.backgroundIcons);

    // Foreground layer (faster, sharper, larger)
    setFgIcons(AMBIENT_CONFIG.foregroundIcons);
  }, []);

  return (
    <>
      {/* BACKGROUND LAYER */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Main Grain Overlay - Fine grain */}
        <div
          className="absolute inset-0 bg-[url('/noise.svg')] bg-repeat mix-blend-overlay z-20"
          style={{
            backgroundSize: AMBIENT_CONFIG.grain.size,
            opacity: AMBIENT_CONFIG.grain.opacity.light,
          }}
        />
        <div
          className="absolute inset-0 bg-[url('/noise.svg')] bg-repeat mix-blend-overlay z-20 dark:block hidden"
          style={{
            backgroundSize: AMBIENT_CONFIG.grain.size,
            opacity: AMBIENT_CONFIG.grain.opacity.dark,
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.1)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.3)_100%)] z-10" />

        {/* Floating "Stuff" - Particles/Dust */}
        <div className="absolute inset-0 z-5">
          {particles.map((i) => (
            <FloatingParticle
              key={`p-${i}`}
              delay={i * 0.8}
              size={Math.random() > 0.8 ? 5 : 3}
              xRange={Math.random() * 100 - 50}
              yRange={Math.random() * 100 - 50}
            />
          ))}
        </div>

        {/* Background Floating Icons */}
        <div className="absolute inset-0 z-5">
          {bgIcons.map((icon, i) => (
            <FloatingIcon
              key={`bg-icon-${i}`}
              delay={i * 3}
              src={icon.src}
              emoji={icon.emoji}
              size={icon.size}
              depth="back"
            />
          ))}
        </div>

        {/* Decorative Background Typography */}
        {AMBIENT_CONFIG.typography.map((typo, i) => (
          <div
            key={`typo-${i}`}
            className={`absolute opacity-[0.03] dark:opacity-[0.02] pointer-events-none blur-[10px] ${typo.className || ""}`}
            style={{
              top: typo.position.top,
              bottom: typo.position.bottom,
              left: typo.position.left,
              right: typo.position.right,
            }}
          >
            <span
              className="font-bold font-serif tracking-tight text-stone-900 dark:text-stone-100 leading-none"
              style={{ fontSize: typo.fontSize }}
            >
              {typo.text}
            </span>
          </div>
        ))}
      </div>

      {/* FOREGROUND LAYER - Floats above content */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {fgIcons.map((icon, i) => (
          <FloatingIcon
            key={`fg-icon-${i}`}
            delay={i * 5 + 2}
            src={icon.src}
            emoji={icon.emoji}
            size={icon.size}
            depth="front"
          />
        ))}
      </div>
    </>
  );
}
