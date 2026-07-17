import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm dark:border-white/10 dark:bg-ink-soft ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
