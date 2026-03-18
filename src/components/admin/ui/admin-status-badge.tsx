import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminStatusBadgeProps = {
  status: string;
  variant?: "subscription" | "webhook" | "health";
};

const SUBSCRIPTION_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-950 text-emerald-400 border-emerald-800",
  TRIALING: "bg-sky-950 text-sky-400 border-sky-800",
  PAST_DUE: "bg-amber-950 text-amber-400 border-amber-800",
  CANCELLED: "bg-rose-950 text-rose-400 border-rose-800",
  INACTIVE: "bg-slate-800 text-slate-400 border-slate-700",
};

const WEBHOOK_COLORS: Record<string, string> = {
  active: "bg-emerald-950 text-emerald-400 border-emerald-800",
  pending: "bg-amber-950 text-amber-400 border-amber-800",
  failed: "bg-rose-950 text-rose-400 border-rose-800",
  disabled: "bg-slate-800 text-slate-400 border-slate-700",
};

const HEALTH_COLORS: Record<string, string> = {
  complete: "bg-emerald-950 text-emerald-400 border-emerald-800",
  partial: "bg-amber-950 text-amber-400 border-amber-800",
  gap: "bg-rose-950 text-rose-400 border-rose-800",
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
    "bg-slate-800 text-slate-400 border-slate-700"
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
