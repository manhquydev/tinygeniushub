import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
};

export function AdminPageHeader({
  title,
  description,
  icon,
  actions,
  eyebrow = "Admin Control",
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "relative mb-6 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] overflow-hidden",
        "shadow-sm",
        className
      )}
    >
      {/* Gradient top accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-500" />

      <div className="px-5 py-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <p className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-1">
              {eyebrow}
            </p>
          )}
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="shrink-0 text-teal-600">{icon}</span>
            )}
            <h1 className="text-xl font-semibold text-[var(--admin-text-primary)] leading-tight">{title}</h1>
          </div>
          <p className="text-sm text-[var(--admin-text-secondary)] mt-1">{description}</p>
        </div>
        {actions && (
          <div className="shrink-0 flex items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
