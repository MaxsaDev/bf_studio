"use client";

/** Round ± button shared by the add-on and cart quantity steppers */
export function StepButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-900 dark:hover:border-stone-300 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-stone-300 dark:disabled:hover:border-stone-700"
    >
      {children}
    </button>
  );
}
