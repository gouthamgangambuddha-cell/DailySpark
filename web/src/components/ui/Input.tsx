import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink/80 dark:text-paper/80">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`rounded-xl border px-4 py-2.5 text-sm text-ink outline-none transition focus:ring-2 focus:ring-spark-500 dark:bg-ink dark:text-paper ${
            error
              ? "border-ember-500 focus:ring-ember-400"
              : "border-ink/20 dark:border-white/20"
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-ember-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
