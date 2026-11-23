"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { THEME_MODE } from "@/lib/theme-config";

const BlackFridayContext = createContext(false);

export function useBlackFriday() {
  return useContext(BlackFridayContext);
}

export function ThemeProvider({
  children,
  active,
  refreshAfterMs,
}: {
  children: ReactNode;
  active: boolean;
  refreshAfterMs: number | null;
}) {
  const router = useRouter();
  useEffect(() => {
    if (refreshAfterMs === null) return;
    // Re-read the server clock at the boundary and when a sleeping tab returns.
    const refresh = () => router.refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = window.setTimeout(refresh, Math.min(refreshAfterMs, 2_147_483_647));
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, refreshAfterMs]);

  const theme = active ? "dark" : THEME_MODE;
  return (
    <BlackFridayContext.Provider value={active}>
      <NextThemesProvider attribute="class" defaultTheme={theme} forcedTheme={theme} enableSystem={false} disableTransitionOnChange>
        {children}
      </NextThemesProvider>
    </BlackFridayContext.Provider>
  );
}
