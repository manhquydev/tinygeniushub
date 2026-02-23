import { Activity, CreditCard, Gift } from "lucide-react";
import { AdminStatsHeader } from "@/components/admin-stats-header";
import { getAdminLearningAnalytics, getAdminOverview, getAdminRetentionAnalytics } from "@/modules/admin/service";

function getSubscriptionBadgeClass(status: string) {
  switch (status) {
    case "ACTIVE_STANDARD":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "TRIALING":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "GRACE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ACTIVE_FAMILYPLUS":
      return "border-teal-200 bg-teal-50 text-teal-700";
    case "CANCELED_AT_PERIOD_END":
    case "EXPIRED":
    case "REFUNDED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getWebhookBadgeClass(status: string) {
  switch (status) {
    case "PROCESSED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "RECEIVED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "IGNORED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export default async function AdminOverviewPage() {
  const [overview, learningAnalytics, retention] = await Promise.all([
    getAdminOverview(),
    getAdminLearningAnalytics(),
    getAdminRetentionAnalytics(),
  ]);

  const subscriptionsByStatus = Object.entries(overview.subscriptionsByStatus);
  const webhooksByStatus = Object.entries(overview.webhooksByStatus);

  return (
    <div className="page-stack">
      <section className="card">
        <h1>Tổng quan quản trị</h1>
        <p className="muted-text">Bảng điều hành: tài khoản, thanh toán, webhook, giới thiệu.</p>
        <AdminStatsHeader
          overview={{
            counts: {
              parents: overview.counts.parents,
              successfulRevenueVnd30d: overview.counts.successfulRevenueVnd30d,
            },
            subscriptionsByStatus: overview.subscriptionsByStatus,
            activeChildrenLast7d: learningAnalytics.activeChildrenLast7d,
          }}
          retention={{
            churned30d: retention.churned30d,
          }}
        />
      </section>

      <section className="card">
        <h2>Chỉ số chính</h2>
        <div className="metrics">
          <article className="metric">
            <span className="muted-text">Phụ huynh</span>
            <strong>{overview.counts.parents}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Hồ sơ bé</span>
            <strong>{overview.counts.children}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Doanh thu 30 ngày</span>
            <strong>{overview.counts.successfulRevenueVnd30d.toLocaleString("vi-VN")} VND</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Rời bỏ 30 ngày</span>
            <strong>{retention.churned30d}</strong>
          </article>
        </div>
      </section>

      <section className="card">
        <h2 className="flex items-center gap-2">
          <CreditCard size={18} className="shrink-0 text-teal-600" />
          Trạng thái gói đăng ký
        </h2>
        <ul className="list-grid">
          {subscriptionsByStatus.map(([status, count]) => (
            <li key={status} className="list-item">
              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getSubscriptionBadgeClass(status)}`}>
                {status}
              </span>
              <strong>{count}</strong>
            </li>
          ))}
          {subscriptionsByStatus.length === 0 ? <li className="list-item">Chưa có dữ liệu gói đăng ký.</li> : null}
        </ul>
      </section>

      <section className="card">
        <h2 className="flex items-center gap-2">
          <Activity size={18} className="shrink-0 text-teal-600" />
          Trạng thái webhook
        </h2>
        <ul className="list-grid">
          {webhooksByStatus.map(([status, count]) => (
            <li key={status} className="list-item">
              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getWebhookBadgeClass(status)}`}>
                {status}
              </span>
              <strong>{count}</strong>
            </li>
          ))}
          {webhooksByStatus.length === 0 ? <li className="list-item">Chưa có dữ liệu webhook.</li> : null}
        </ul>
      </section>

      <section className="card">
        <h2 className="flex items-center gap-2">
          <Gift size={18} className="shrink-0 text-teal-600" />
          Giới thiệu & Liên kết
        </h2>
        <div className="metrics">
          <article className="metric">
            <span className="muted-text">Mã giới thiệu</span>
            <strong>{overview.counts.referralCodes}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Lượt quy về</span>
            <strong>{overview.counts.referralAttributions}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Giới thiệu đã thanh toán</span>
            <strong>{overview.counts.paidReferrals}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Phần thưởng đã cấp</span>
            <strong>{overview.counts.rewardedReferrals}</strong>
          </article>
        </div>
      </section>
    </div>
  );
}
