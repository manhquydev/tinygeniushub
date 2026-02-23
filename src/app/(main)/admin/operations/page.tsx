import { AdminAnnouncementPanel } from "@/components/admin-announcement-panel";
import { AdminCouponPanel } from "@/components/admin-coupon-panel";
import { AdminExportData } from "@/components/admin-export-data";
import { AdminOperationsPanel } from "@/components/admin-operations-panel";
import { prisma } from "@/lib/db";
import { getAdminOverview } from "@/modules/admin/service";

export default async function AdminOperationsPage() {
  const overview = await getAdminOverview();

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
      <AdminExportData />

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
      />

      <AdminAnnouncementPanel />
      <AdminCouponPanel />
    </div>
  );
}
