import { AdminAnnouncementPanel } from "@/components/admin-announcement-panel";
import { AdminCouponPanel } from "@/components/admin-coupon-panel";
import { AdminExportData } from "@/components/admin-export-data";
import { AdminOperationsPanel } from "@/components/admin-operations-panel";
import { AdminOperationsTabs } from "@/components/admin-operations-tabs";
import { prisma } from "@/lib/db";
import { getAdminOverview } from "@/modules/admin/service";
import { Settings } from "lucide-react";

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
      {/* Page header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
          <Settings size={18} className="text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vận hành hệ thống</h1>
          <p className="text-sm text-slate-500">
            Thanh toán, webhook, bài học dùng thử, thông báo và mã giảm giá.
          </p>
        </div>
        <div className="ml-auto">
          <AdminExportData />
        </div>
      </div>

      {/* Tabbed panels */}
      <AdminOperationsTabs
        payments={payments}
        webhooks={webhooks}
        lessonTrialRows={lessons}
      />
    </div>
  );
}
