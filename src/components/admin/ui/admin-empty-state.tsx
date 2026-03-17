import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminEmptyStateProps = {
  icon?: ReactNode;
  message: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function AdminEmptyState({ icon, message, description, action, className }: AdminEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-10 text-center", className)}>
      {icon && (
        <div className="mb-3 text-slate-300">{icon}</div>
      )}
      <p className="text-sm font-medium text-slate-500">{message}</p>
      {description && (
        <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
