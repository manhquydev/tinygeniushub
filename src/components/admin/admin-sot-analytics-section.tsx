import { AlertCircle, CheckCircle2, Database, Radio } from "lucide-react";
import { AdminDataTable } from "@/components/admin/ui/admin-data-table";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";
import type { AdminSoTDashboardSnapshot } from "@/modules/admin/service";

function asPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("vi-VN");
}

export function AdminSoTAnalyticsSection({ snapshot }: { snapshot: AdminSoTDashboardSnapshot }) {
  const ga4 = snapshot.ga4;
  const sql = snapshot.sqlAudit;
  const ga4ConversionRate = asPercent(ga4.eventCounts.purchaseSucceeded, ga4.eventCounts.checkoutStarted);
  const ga4StatusLabel =
    ga4.status === "ready"
      ? "GA4 connected"
      : ga4.status === "disabled"
        ? "GA4 not configured"
        : "GA4 error";

  const topEventsRows = ga4.topEvents.map((item) => ({
    eventName: item.eventName,
    eventCount: item.eventCount,
  }));

  return (
    <AdminSectionCard title="SoT: GA4 + SQL Audit (7 days)" icon={<Database size={16} />}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <AdminStatCard
            label="GA4 Sessions"
            value={ga4.sessions}
            icon={<Radio size={14} />}
            trend={{ value: ga4.activeUsers, label: `${ga4.activeUsers} active users` }}
          />
          <AdminStatCard
            label="GA4 Checkout -> Purchase"
            value={`${ga4ConversionRate}%`}
            trend={{
              value: ga4.eventCounts.purchaseSucceeded,
              label: `${ga4.eventCounts.purchaseSucceeded}/${ga4.eventCounts.checkoutStarted}`,
            }}
          />
          <AdminStatCard
            label="SQL Checkout -> Purchase"
            value={`${sql.checkoutToPurchaseRate7d}%`}
            trend={{
              value: sql.counts7d.course_purchase_succeeded,
              label: `${sql.counts7d.course_purchase_succeeded}/${sql.counts7d.course_checkout_started}`,
            }}
          />
          <AdminStatCard
            label="Latest SQL Audit"
            value={formatDate(sql.latestAuditAt)}
            trend={{
              value: sql.counts7d["learning.lesson.video.watch.completed"],
              label: `${sql.counts7d["learning.lesson.video.watch.completed"]} watch complete events`,
            }}
          />
        </div>

        <div
          className={`rounded-lg border p-3 text-sm ${
            ga4.status === "ready"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          <div className="flex items-start gap-2">
            {ga4.status === "ready" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <div>
              <p className="font-semibold">{ga4StatusLabel}</p>
              <p className="text-xs">
                {ga4.status === "ready"
                  ? `Property: ${ga4.propertyId ?? "N/A"}`
                  : "Set GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT_CLIENT_EMAIL, GA4_SERVICE_ACCOUNT_PRIVATE_KEY to enable live GA4 SoT."}
              </p>
              {ga4.errorMessage ? <p className="text-xs mt-1">Error: {ga4.errorMessage}</p> : null}
            </div>
          </div>
        </div>

        <AdminDataTable
          columns={[
            { key: "eventName", label: "GA4 Event" },
            { key: "eventCount", label: "Count (7d)" },
          ]}
          data={topEventsRows as Record<string, unknown>[]}
          emptyMessage="No GA4 event data in current window."
        />
      </div>
    </AdminSectionCard>
  );
}
