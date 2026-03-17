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
        label="Phụ huynh"
        value={overview.counts.parents}
        icon={<Users size={16} />}
      />
      <AdminStatCard
        label="Gói đang hoạt động"
        value={activeSubscriptionCount}
        icon={<CircleDot size={16} />}
      />
      <AdminStatCard
        label="Doanh thu 30 ngày"
        value={`${toCurrencyVnd(overview.counts.successfulRevenueVnd30d)} ₫`}
        icon={<TrendingUp size={16} />}
      />
      <AdminStatCard
        label="Bé hoạt động 7 ngày"
        value={overview.activeChildrenLast7d}
        icon={<BookOpen size={16} />}
      />
      <AdminStatCard
        label="Rời bỏ 30 ngày"
        value={retention.churned30d}
        icon={<TrendingDown size={16} />}
      />
    </div>
  );
}
