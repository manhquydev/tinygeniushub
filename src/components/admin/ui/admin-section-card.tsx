import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminSectionCardProps = {
  title?: string;
  icon?: ReactNode;
  description?: string;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
};

export function AdminSectionCard({
  title,
  icon,
  description,
  children,
  className,
  headerActions,
}: AdminSectionCardProps) {
  return (
    <Card className={cn("bg-white border-slate-200 shadow-sm", className)}>
      {(title || icon) && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {icon && <span className="text-teal-600 shrink-0">{icon}</span>}
              {title && (
                <CardTitle className="text-sm font-semibold text-slate-800">{title}</CardTitle>
              )}
            </div>
            {headerActions && (
              <div className="shrink-0">{headerActions}</div>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(!title && !icon ? "pt-6" : "pt-0")}>{children}</CardContent>
    </Card>
  );
}
