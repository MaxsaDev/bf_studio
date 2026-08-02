/**
 * Shared intro/splash timing so the header choreography
 * stays in sync with the splash screen.
 */

export const SPLASH_DURATION_MS = 2500;

/** Header intro delay while the splash plays (seconds, first visit) */
export const INTRO_DELAY = 2.4;

/** Header intro delay for returning visitors who skip the splash */
export const INTRO_DELAY_SKIPPED = 0.3;

const SPLASH_KEY = "bf-splash-seen";

export function hasSeenSplash(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SPLASH_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSplashSeen(): void {
  try {
    sessionStorage.setItem(SPLASH_KEY, "1");
  } catch {
    // Storage unavailable (private mode) — splash will just replay
  }
}
