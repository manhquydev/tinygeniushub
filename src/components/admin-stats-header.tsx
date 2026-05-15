import { BookOpen, CircleDot, TrendingDown, TrendingUp, Users } from "lucide-react";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";

type AdminStatsHeaderProps = {
  overview: {
    counts: {
      parents: number;
      successfulRevenueVnd30d: number;
    };
    subscriptionsByStatus: Record<string, number>;
    activeChildrenLast7d: number;
  };
  retention: {
    churned30d: number;
  };
};

function toCurrencyVnd(value: number) {
  return value.toLocaleString("vi-VN");
}

function getActiveSubscriptionCount(subscriptionsByStatus: Record<string, number>) {
  const activeStatuses = [
    "TRIALING",
    "ACTIVE_STANDARD",
    "ACTIVE_FAMILYPLUS",
    "GRACE",
    "CANCELED_AT_PERIOD_END",
  ];
  return activeStatuses.reduce((total, status) => total + (subscriptionsByStatus[status] ?? 0), 0);
}

export function AdminStatsHeader({ overview, retention }: AdminStatsHeaderProps) {
  const activeSubscriptionCount = getActiveSubscriptionCount(overview.subscriptionsByStatus);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <AdminStatCard
        label="Parents"
        value={overview.counts.parents}
        icon={<Users size={16} />}
      />
      <AdminStatCard
        label="Package is active"
        value={activeSubscriptionCount}
        icon={<CircleDot size={16} />}
      />
      <AdminStatCard
        label="30-day revenue"
        value={`${toCurrencyVnd(overview.counts.successfulRevenueVnd30d)} ₫`}
        icon={<TrendingUp size={16} />}
      />
      <AdminStatCard
        label="Baby is active for 7 days"
        value={overview.activeChildrenLast7d}
        icon={<BookOpen size={16} />}
      />
      <AdminStatCard
        label="Leave 30 days"
        value={retention.churned30d}
        icon={<TrendingDown size={16} />}
      />
    </div>
  );
}
