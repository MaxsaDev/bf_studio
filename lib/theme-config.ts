/**
 * Theme Configuration
 *
 * Manually change these constants to customize the theme and ambient background.
 * After changing, redeploy the application.
 */

/**
 * Theme Mode
 * Options: "light" | "dark"
 */
export const THEME_MODE: "light" | "dark" = "light";

/**
 * Ambient Background Configuration
 */

export interface AmbientIcon {
  type: "img" | "emoji";
  src?: string;
  emoji?: string;
  size: number;
}

export interface AmbientTypography {
  text: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  className?: string;
  fontSize: string;
}

export interface AmbientParticleConfig {
  desktop: number;
  mobile: number;
}

export const AMBIENT_CONFIG = {
  /**
   * Particle Settings
   * Control the number of floating dust particles
   */
  particles: {
    desktop: 12,
    mobile: 6,
  } as AmbientParticleConfig,

  /**
   * Background Icons
   * These float slower and are blurred for depth effect
   */
  backgroundIcons: [
    { type: "img", src: "/sparkles.png", size: 32 },
    { type: "emoji", emoji: "🌿", size: 28 },
    { type: "emoji", emoji: "🪷", size: 30 },
  ] as AmbientIcon[],

  /**
   * Foreground Icons
   * These float faster and are sharper, appearing above content
   */
  foregroundIcons: [
    { type: "img", src: "/seeding.png", size: 48 },
    { type: "emoji", emoji: "✨", size: 32 },
  ] as AmbientIcon[],

  /**
   * Background Typography
   * Large decorative text that appears behind content
   */
  typography: [
    {
      text: "BODY",
      position: { top: "15%", left: "5%" },
      fontSize: "12vw",
    },
    {
      text: "STUDIO",
      position: { top: "45%", right: "5%" },
      fontSize: "12vw",
      className: "text-right",
    },
    {
      text: "FACTORY",
      position: { bottom: "10%", left: "10%" },
      fontSize: "10vw",
    },
  ] as AmbientTypography[],

  /**
   * Grain Overlay Settings
   */
  grain: {
    opacity: {
      light: 0.04,
      dark: 0.025,
    },
    size: "100px",
  },
};
