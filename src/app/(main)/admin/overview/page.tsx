import { Activity, CreditCard, Gift, Layers3 } from "lucide-react";
import { getLocale } from "next-intl/server";
import { AdminModuleHealthGrid } from "@/components/admin/admin-module-health-grid";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/ui/admin-status-badge";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { getVisibleAdminModules } from "@/components/admin/admin-module-catalog";
import { AdminStatsHeader } from "@/components/admin-stats-header";
import { getAdminSession } from "@/modules/admin/admin-auth-service";
import {
  getAdminLearningAnalytics,
  getAdminOverview,
  getAdminRetentionAnalytics,
} from "@/modules/admin/service";
import { translate, type TranslationValues } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

export default async function AdminOverviewPage() {
  const [overview, learningAnalytics, retention, adminSession] = await Promise.all([
    getAdminOverview(),
    getAdminLearningAnalytics(),
    getAdminRetentionAnalytics(),
    getAdminSession(),
  ]);

  const locale = resolveAppLocale(await getLocale());
  const t = (key: string, values?: TranslationValues) =>
    translate(`admin.overview.${key}`, values, locale);

  const role = adminSession?.user.role ?? "STAFF_ADMIN";
  const visibleModules = getVisibleAdminModules(role);
  const moduleHealth = {
    complete: visibleModules.filter((m) => m.health === "complete").length,
    partial: visibleModules.filter((m) => m.health === "partial").length,
    gap: visibleModules.filter((m) => m.health === "gap").length,
  };

  const subscriptionsByStatus = Object.entries(overview.subscriptionsByStatus);
  const webhooksByStatus = Object.entries(overview.webhooksByStatus);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        icon={<Layers3 size={18} />}
        eyebrow={t("eyebrow")}
      />

      <AdminStatsHeader
        overview={{
          counts: {
            parents: overview.counts.parents,
            successfulRevenueVnd30d: overview.counts.successfulRevenueVnd30d,
          },
          subscriptionsByStatus: overview.subscriptionsByStatus,
          activeChildrenLast7d: learningAnalytics.activeChildrenLast7d,
        }}
        retention={{ churned30d: retention.churned30d }}
      />

      <AdminSectionCard
        title={t("moduleMap")}
        icon={<Layers3 size={16} />}
        headerActions={
          <div className="flex items-center gap-3 text-xs text-[var(--admin-text-muted)]">
            <span className="text-emerald-600 font-medium">{t("moduleComplete", { count: moduleHealth.complete })}</span>
            <span className="text-amber-600 font-medium">{t("modulePartial", { count: moduleHealth.partial })}</span>
            <span className="text-rose-600 font-medium">{t("moduleGap", { count: moduleHealth.gap })}</span>
          </div>
        }
      >
        <AdminModuleHealthGrid modules={visibleModules} />
      </AdminSectionCard>

      <AdminSectionCard title={t("subscriptionSection")} icon={<CreditCard size={16} />}>
        {subscriptionsByStatus.length === 0 ? (
          <AdminEmptyState message={t("subscriptionEmpty")} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {subscriptionsByStatus.map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] px-3 py-2">
                <AdminStatusBadge status={status} variant="subscription" />
                <span className="text-sm font-bold text-[var(--admin-text-secondary)]">{count}</span>
              </div>
            ))}
          </div>
        )}
      </AdminSectionCard>

      <AdminSectionCard title={t("webhookSection")} icon={<Activity size={16} />}>
        {webhooksByStatus.length === 0 ? (
          <AdminEmptyState message={t("webhookEmpty")} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {webhooksByStatus.map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] px-3 py-2">
                <AdminStatusBadge status={status} variant="webhook" />
                <span className="text-sm font-bold text-[var(--admin-text-secondary)]">{count}</span>
              </div>
            ))}
          </div>
        )}
      </AdminSectionCard>

      <AdminSectionCard title={t("referralSection")} icon={<Gift size={16} />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <AdminStatCard label={t("referralCode")} value={overview.counts.referralCodes} />
          <AdminStatCard label={t("referralReturns")} value={overview.counts.referralAttributions} />
          <AdminStatCard label={t("referralPaid")} value={overview.counts.paidReferrals} />
          <AdminStatCard label={t("referralRewards")} value={overview.counts.rewardedReferrals} />
        </div>
      </AdminSectionCard>
    </div>
  );
}
