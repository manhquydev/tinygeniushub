import { AdminExportData } from "@/components/admin-export-data";
import { AdminOperationsTabs } from "@/components/admin-operations-tabs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminOverview } from "@/modules/admin/service";
import { prisma } from "@/lib/db";
import { Settings2 } from "lucide-react";

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

  const payments = overview.recentPayments.map((payment) => ({
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
  }));

  const webhooks = overview.recentWebhookEvents.map((event) => ({
    id: event.id,
    provider: event.provider,
    eventId: event.eventId,
    signatureValid: event.signatureValid,
    status: event.status,
    errorMessage: null,
    processedAt: event.processedAt ? event.processedAt.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
  }));

  const lessons = lessonTrialRows.map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    trialEnabled: lesson.trialEnabled,
    trackCode: lesson.unit.level.track.code,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Vận hành hệ thống"
        description="Thanh toán, webhook, trial-flag, thông báo và dữ liệu xuất."
        icon={<Settings2 size={18} />}
        actions={<AdminExportData />}
        eyebrow="Commerce & Ops"
      />

      <AdminOperationsTabs
        payments={payments}
        webhooks={webhooks}
        lessonTrialRows={lessons}
      />
    </div>
  );
}
