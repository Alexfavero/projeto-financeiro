import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="mb-3.5">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-xs font-semibold text-ink-secondary"
          >
            {label.toUpperCase()}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/30 ${
            error ? "border-critical" : "border-border"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-critical">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
