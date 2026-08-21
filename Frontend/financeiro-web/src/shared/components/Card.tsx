import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Card({ title, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-border bg-white p-5 ${className}`}
      {...props}
    >
      {title && (
        <h3 className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
