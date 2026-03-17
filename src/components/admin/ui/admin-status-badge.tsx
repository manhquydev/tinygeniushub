import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminStatusBadgeProps = {
  status: string;
  variant?: "subscription" | "webhook" | "health";
};

const SUBSCRIPTION_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  TRIALING: "bg-sky-100 text-sky-800 border-sky-200",
  PAST_DUE: "bg-amber-100 text-amber-800 border-amber-200",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
  INACTIVE: "bg-slate-100 text-slate-600 border-slate-200",
};

const WEBHOOK_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  failed: "bg-rose-100 text-rose-800 border-rose-200",
  disabled: "bg-slate-100 text-slate-600 border-slate-200",
};

const HEALTH_COLORS: Record<string, string> = {
  complete: "bg-emerald-100 text-emerald-800 border-emerald-200",
  partial: "bg-amber-100 text-amber-800 border-amber-200",
  gap: "bg-rose-100 text-rose-800 border-rose-200",
};

function getColor(status: string, variant: AdminStatusBadgeProps["variant"]) {
  const key = status.toUpperCase();
  const lower = status.toLowerCase();
  if (variant === "subscription") return SUBSCRIPTION_COLORS[key] ?? SUBSCRIPTION_COLORS["INACTIVE"];
  if (variant === "webhook") return WEBHOOK_COLORS[lower] ?? WEBHOOK_COLORS["disabled"];
  if (variant === "health") return HEALTH_COLORS[lower] ?? HEALTH_COLORS["gap"];
  // Auto-detect
  return (
    SUBSCRIPTION_COLORS[key] ??
    WEBHOOK_COLORS[lower] ??
    HEALTH_COLORS[lower] ??
    "bg-slate-100 text-slate-600 border-slate-200"
  );
}

export function AdminStatusBadge({ status, variant }: AdminStatusBadgeProps) {
  const colorClass = getColor(status, variant);
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium border", colorClass)}
    >
      {status}
    </Badge>
  );
}
