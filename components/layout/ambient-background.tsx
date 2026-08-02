"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AMBIENT_CONFIG, AmbientIcon } from "@/lib/theme-config";

/**
 * Random values are generated ONCE (in the mount effect) and stored in
 * state, so re-renders never teleport particles or restart animations.
 */
interface ParticleConfig {
  left: string;
  top: string;
  size: number;
  xRange: number;
  yRange: number;
  duration: number;
  delay: number;
}

interface IconConfig extends AmbientIcon {
  left: string;
  top: string;
  yMove: number;
  xMove: number;
  duration: number;
  delay: number;
  depth: "back" | "front";
}

function createParticle(index: number): ParticleConfig {
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() > 0.8 ? 5 : 3,
    xRange: Math.random() * 100 - 50,
    yRange: Math.random() * 100 - 50,
    duration: 10 + Math.random() * 10,
    delay: index * 0.8,
  };
}

function createIcon(
  icon: AmbientIcon,
  index: number,
  depth: "back" | "front"
): IconConfig {
  return {
    ...icon,
    left: `${Math.random() * 90 + 5}%`,
    top: `${Math.random() * 90 + 5}%`,
    yMove: -50 - Math.random() * 100,
    xMove: (Math.random() - 0.5) * 100,
    duration:
      depth === "front" ? 20 + Math.random() * 10 : 35 + Math.random() * 15,
    delay: depth === "front" ? index * 5 + 2 : index * 3,
    depth,
  };
}

function FloatingParticle({ config }: { config: ParticleConfig }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        y: [0, -config.yRange, 0],
        x: [0, config.xRange, 0],
      }}
      transition={{
        duration: config.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: config.delay,
      }}
      className="absolute rounded-full bg-stone-400/30 dark:bg-stone-500/30 blur-[1px]"
      style={{
        width: config.size,
        height: config.size,
        left: config.left,
        top: config.top,
      }}
    />
  );
}

function FloatingIcon({ config }: { config: IconConfig }) {
  const isFront = config.depth === "front";

  return (
    <motion.div
      initial={{ opacity: 0, scale: isFront ? 0.8 : 0.6 }}
      animate={{
        opacity: isFront ? [0, 0.8, 0] : [0, 0.4, 0],
        y: [0, config.yMove, 0],
        x: [0, config.xMove, 0],
        rotate: [0, 10, -10, 0],
        scale: isFront ? [0.8, 1.2, 0.8] : 0.8,
      }}
      transition={{
        duration: config.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: config.delay,
      }}
      className={`absolute pointer-events-none select-none mix-blend-multiply dark:mix-blend-screen ${
        isFront ? "z-50" : "z-0"
      }`}
      style={{
        left: config.left,
        top: config.top,
        filter: isFront ? "blur(0px)" : "blur(1.5px)",
      }}
    >
      {config.src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={config.src}
          alt=""
          style={{ width: config.size, height: "auto" }}
          className={isFront ? "opacity-90 drop-shadow-lg" : "opacity-60"}
        />
      ) : (
        <span
          style={{ fontSize: config.size }}
          className={isFront ? "opacity-80 drop-shadow-md" : "opacity-50"}
        >
          {config.emoji}
        </span>
      )}
    </motion.div>
  );
}

export function AmbientBackground() {
  const shouldReduceMotion = useReducedMotion();

  // Hydration-safe: configs generated client-side after mount
  const [particles, setParticles] = useState<ParticleConfig[]>([]);
  const [bgIcons, setBgIcons] = useState<IconConfig[]>([]);
  const [fgIcons, setFgIcons] = useState<IconConfig[]>([]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const frame = requestAnimationFrame(() => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const particleCount = isMobile
        ? AMBIENT_CONFIG.particles.mobile
        : AMBIENT_CONFIG.particles.desktop;

      setParticles(
        Array.from({ length: particleCount }, (_, i) => createParticle(i))
      );
      setBgIcons(
        AMBIENT_CONFIG.backgroundIcons.map((icon, i) =>
          createIcon(icon, i, "back")
        )
      );
      setFgIcons(
        AMBIENT_CONFIG.foregroundIcons.map((icon, i) =>
          createIcon(icon, i, "front")
        )
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [shouldReduceMotion]);

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
          {particles.map((config, i) => (
            <FloatingParticle key={`p-${i}`} config={config} />
          ))}
        </div>

        {/* Background Floating Icons */}
        <div className="absolute inset-0 z-5">
          {bgIcons.map((config, i) => (
            <FloatingIcon key={`bg-icon-${i}`} config={config} />
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
        {fgIcons.map((config, i) => (
          <FloatingIcon key={`fg-icon-${i}`} config={config} />
        ))}
      </div>
    </>
  );
}
