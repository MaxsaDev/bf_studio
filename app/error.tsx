"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-background text-foreground">
      <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
        Щось пішло не так
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md leading-relaxed">
        Сталася непередбачена помилка. Спробуйте оновити сторінку — якщо
        проблема повторюється, зв&apos;яжіться з нами.
      </p>
      <Button
        onClick={reset}
        className="rounded-full px-8 h-12 bg-stone-900 dark:bg-stone-50 text-stone-50 dark:text-stone-900 font-bold"
      >
        Спробувати ще раз
      </Button>
    </main>
  );
}
