import type { ReactNode } from "react";

type BadgeVariant = "good" | "warning" | "critical" | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  good: "bg-good/10 text-good",
  warning: "bg-warning/15 text-[#a06400] dark:text-[#ffd166]",
  critical: "bg-critical/10 text-critical",
  muted: "bg-surface-alt text-ink-secondary",
};

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
