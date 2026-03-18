import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Trend = { value: number; label: string };

type AdminStatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: Trend;
  className?: string;
};

function TrendBadge({ trend }: { trend: Trend }) {
  const positive = trend.value > 0;
  const neutral = trend.value === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        positive && "text-emerald-600",
        !positive && !neutral && "text-rose-500",
        neutral && "text-[var(--admin-text-muted)]"
      )}
    >
      {neutral ? (
        <Minus size={12} />
      ) : positive ? (
        <TrendingUp size={12} />
      ) : (
        <TrendingDown size={12} />
      )}
      {trend.label}
    </span>
  );
}

export function AdminStatCard({ label, value, icon, trend, className }: AdminStatCardProps) {
  return (
    <Card className={cn("bg-[var(--admin-card-bg)] border-[var(--admin-card-border)] shadow-sm", className)}>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <p className="text-xs font-medium text-[var(--admin-text-secondary)] uppercase tracking-wide">{label}</p>
        {icon && <span className="text-[var(--admin-text-secondary)]">{icon}</span>}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-[var(--admin-text-primary)]">{value}</p>
        {trend && (
          <div className="mt-1">
            <TrendBadge trend={trend} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
