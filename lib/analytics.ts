/**
 * Lightweight analytics facade. Forwards funnel events to gtag/dataLayer
 * when present; no-ops otherwise. Swap the implementation here when a
 * concrete provider is wired up.
 */

type EventProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: string, props?: EventProps): void {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", event, props);
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event, ...props });
  } else if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, props);
  }
}
