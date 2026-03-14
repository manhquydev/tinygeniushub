import { BookOpen, CircleDot, TrendingDown, TrendingUp, Users } from "lucide-react";

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

  const pills = [
    {
      key: "parents",
      icon: Users,
      text: `Phụ huynh: ${overview.counts.parents}`,
    },
    {
      key: "active-subs",
      icon: CircleDot,
      text: `Gói đang hoạt động: ${activeSubscriptionCount}`,
    },
    {
      key: "revenue-30d",
      icon: TrendingUp,
      text: `Doanh thu 30 ngày: ${toCurrencyVnd(overview.counts.successfulRevenueVnd30d)} VND`,
    },
    {
      key: "active-kids-7d",
      icon: BookOpen,
      text: `Bé hoạt động 7 ngày: ${overview.activeChildrenLast7d}`,
    },
    {
      key: "churn-30d",
      icon: TrendingDown,
      text: `Rời bỏ 30 ngày: ${retention.churned30d}`,
    },
  ];

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        {pills.map(({ key, icon: Icon, text }) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700"
          >
            <Icon size={14} className="shrink-0 text-slate-400" />
            <span>{text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
