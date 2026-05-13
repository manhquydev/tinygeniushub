"use client";

import { DEFAULT_LIMIT, MAX_LIMIT, MIN_LIMIT } from "./admin/operations/admin-operations-constants";
import { AdminOperationsPaymentsSection } from "./admin/operations/admin-operations-payments-section";
import { AdminOperationsTrialsSection } from "./admin/operations/admin-operations-trials-section";
import { AdminOperationsWebhooksSection } from "./admin/operations/admin-operations-webhooks-section";
import type { AdminOperationsPanelProps } from "./admin/operations/admin-operations-types";
import { useAdminOperationsController } from "./admin/operations/use-admin-operations-controller";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminOperationsPanel({
  initialPayments,
  initialWebhooks,
  lessonTrialRows,
}: AdminOperationsPanelProps) {
  const vm = useAdminOperationsController({
    initialPayments,
    initialWebhooks,
    lessonTrialRows,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label htmlFor="record-limit" className="text-sm text-[var(--admin-text-secondary)] shrink-0">
          Record limit
        </Label>
        <Input
          id="record-limit"
          value={vm.limit}
          type="number"
          min={MIN_LIMIT}
          max={MAX_LIMIT}
          onChange={(event) => vm.setLimit(event.target.value)}
          placeholder={String(DEFAULT_LIMIT)}
          className="w-28 h-8 text-sm"
        />
      </div>

      <AdminOperationsPaymentsSection
        paymentStatus={vm.paymentStatus}
        loadingPayments={vm.loadingPayments}
        payments={vm.payments}
        webhooks={vm.webhooks}
        openReconcilePaymentId={vm.openReconcilePaymentId}
        reconcilingPaymentId={vm.reconcilingPaymentId}
        reconcileAction={vm.reconcileAction}
        reconcileWebhookResolution={vm.reconcileWebhookResolution}
        reconcileWebhookId={vm.reconcileWebhookId}
        reconcileNote={vm.reconcileNote}
        onPaymentStatusChange={vm.setPaymentStatus}
        onRefreshPayments={vm.refreshPayments}
        onToggleReconcilePanel={vm.openReconcilePanel}
        onReconcileActionChange={vm.setReconcileAction}
        onReconcileWebhookResolutionChange={vm.setReconcileWebhookResolution}
        onReconcileWebhookIdChange={vm.setReconcileWebhookId}
        onReconcileNoteChange={vm.setReconcileNote}
        onSubmitReconcile={vm.submitReconcile}
        onCloseReconcile={() => vm.setOpenReconcilePaymentId(null)}
      />

      <AdminOperationsWebhooksSection
        webhookStatus={vm.webhookStatus}
        loadingWebhooks={vm.loadingWebhooks}
        webhooks={vm.webhooks}
        onWebhookStatusChange={vm.setWebhookStatus}
        onRefreshWebhooks={vm.refreshWebhooks}
      />

      <AdminOperationsTrialsSection
        lessons={vm.lessons}
        updatingLessonId={vm.updatingLessonId}
        onToggleTrial={vm.toggleTrialFlag}
      />

      {vm.error ? <p className="text-sm text-rose-600">{vm.error}</p> : null}
      {vm.info ? <p className="text-sm text-[var(--admin-text-secondary)]">{vm.info}</p> : null}
    </div>
  );
}
