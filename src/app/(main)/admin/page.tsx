import { AdminOperationsPanel } from "@/components/admin-operations-panel";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { getAdminOverview } from "@/modules/admin/service";
import { getAdminSecuritySettings } from "@/modules/platform/security-policy-service";

export default async function AdminPage() {
  await requireAdminParent();
  const [overview, securitySettings] = await Promise.all([
    getAdminOverview(),
    getAdminSecuritySettings(),
  ]);

  const subscriptionsByStatus = Object.entries(overview.subscriptionsByStatus);
  const webhooksByStatus = Object.entries(overview.webhooksByStatus);

  const lessonTrialRows = await prisma.lesson.findMany({
    orderBy: [
      { unit: { level: { track: { code: "asc" } } } },
      { unit: { level: { orderNo: "asc" } } },
      { unit: { orderNo: "asc" } },
      { orderNo: "asc" },
    ],
    select: {
      id: true,
      slug: true,
      title: true,
      trialEnabled: true,
      unit: {
        select: {
          level: {
            select: {
              track: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      },
    },
    take: 30,
  });

  return (
    <div className="page-stack">
      <section className="card">
        <h1>Admin / CMS</h1>
        <p className="muted-text">Operational dashboard for accounts, payments, webhooks, and referral program.</p>
        <div className="metrics">
          <article className="metric">
            <span className="muted-text">Parents</span>
            <strong>{overview.counts.parents}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Children</span>
            <strong>{overview.counts.children}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Successful payments (30d)</span>
            <strong>{overview.counts.successfulPayments30d}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Revenue (30d, VND)</span>
            <strong>{overview.counts.successfulRevenueVnd30d.toLocaleString("vi-VN")}</strong>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Subscription Status</h2>
        <ul className="list-grid">
          {subscriptionsByStatus.map(([status, count]) => (
            <li key={status} className="list-item">
              <span>{status}</span>
              <strong>{count}</strong>
            </li>
          ))}
          {subscriptionsByStatus.length === 0 ? <li className="list-item">No subscription data yet.</li> : null}
        </ul>
      </section>

      <section className="card">
        <h2>Webhook Status</h2>
        <ul className="list-grid">
          {webhooksByStatus.map(([status, count]) => (
            <li key={status} className="list-item">
              <span>{status}</span>
              <strong>{count}</strong>
            </li>
          ))}
          {webhooksByStatus.length === 0 ? <li className="list-item">No webhook data yet.</li> : null}
        </ul>
      </section>

      <section className="card">
        <h2>Referral / Affiliate</h2>
        <div className="metrics">
          <article className="metric">
            <span className="muted-text">Referral codes</span>
            <strong>{overview.counts.referralCodes}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Attributions</span>
            <strong>{overview.counts.referralAttributions}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Paid referrals</span>
            <strong>{overview.counts.paidReferrals}</strong>
          </article>
          <article className="metric">
            <span className="muted-text">Reward granted</span>
            <strong>{overview.counts.rewardedReferrals}</strong>
          </article>
        </div>
      </section>

      <AdminOperationsPanel
        initialPayments={overview.recentPayments.map((payment) => ({
          id: payment.id,
          provider: payment.provider,
          providerTransactionId: payment.providerTransactionId,
          amountVnd: payment.amountVnd,
          currency: "VND",
          status: payment.status,
          processedAt: payment.processedAt.toISOString(),
          parent: {
            email: payment.parent.email,
          },
        }))}
        initialWebhooks={overview.recentWebhookEvents.map((event) => ({
          id: event.id,
          provider: event.provider,
          eventId: event.eventId,
          signatureValid: event.signatureValid,
          status: event.status,
          errorMessage: null,
          processedAt: event.processedAt ? event.processedAt.toISOString() : null,
          createdAt: event.createdAt.toISOString(),
        }))}
        lessonTrialRows={lessonTrialRows.map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          trialEnabled: lesson.trialEnabled,
          trackCode: lesson.unit.level.track.code,
        }))}
        initialSecurityPolicies={securitySettings.policies}
        initialSecurityControls={securitySettings.controls}
      />
    </div>
  );
}
