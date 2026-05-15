"use client";

import { useState } from "react";
import { DEFAULT_LIMIT, MAX_LIMIT, MIN_LIMIT } from "./admin-operations-constants";
import { normalizeLimit } from "./admin-operations-utils";
import type {
  LessonTrialRow,
  PaymentRow,
  ReconcileAction,
  ReconcileWebhookResolution,
  WebhookRow,
} from "./admin-operations-types";

type UseAdminOperationsControllerInput = {
  initialPayments: PaymentRow[];
  initialWebhooks: WebhookRow[];
  lessonTrialRows: LessonTrialRow[];
};

async function logAdminAction(input: { action: string; target?: string; detail?: unknown }) {
  try {
    await fetch("/api/admin/log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      keepalive: true,
    });
  } catch {
    // Error logging must not interrupt operations.
  }
}

export function useAdminOperationsController(input: UseAdminOperationsControllerInput) {
  const [payments, setPayments] = useState(input.initialPayments);
  const [webhooks, setWebhooks] = useState(input.initialWebhooks);
  const [lessons, setLessons] = useState(input.lessonTrialRows);
  const [paymentStatus, setPaymentStatus] = useState<"ALL" | "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED">("ALL");
  const [webhookStatus, setWebhookStatus] = useState<"ALL" | "RECEIVED" | "PROCESSED" | "IGNORED" | "FAILED">("ALL");
  const [limit, setLimit] = useState(String(DEFAULT_LIMIT));
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [updatingLessonId, setUpdatingLessonId] = useState<string | null>(null);
  const [openReconcilePaymentId, setOpenReconcilePaymentId] = useState<string | null>(null);
  const [reconcileAction, setReconcileAction] = useState<ReconcileAction>("SYNC_ENROLLMENTS");
  const [reconcileWebhookResolution, setReconcileWebhookResolution] = useState<ReconcileWebhookResolution>("NONE");
  const [reconcileWebhookId, setReconcileWebhookId] = useState("");
  const [reconcileNote, setReconcileNote] = useState("");
  const [reconcilingPaymentId, setReconcilingPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function refreshPayments() {
    setLoadingPayments(true); setError(null); setInfo(null);
    try {
      const limitValue = normalizeLimit(limit);
      if (limitValue === null) { setError(`The limit must be an integer in the range${MIN_LIMIT}-${MAX_LIMIT}.`); return; }
      const params = new URLSearchParams({ limit: String(limitValue) });
      if (paymentStatus !== "ALL") params.set("status", paymentStatus);
      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      const body = await response.json();
      if (!response.ok || !body.ok || !Array.isArray(body.data?.payments)) { setError(body.error?.message ?? "Unable to load transaction."); return; }
      setPayments(body.data.payments as PaymentRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally { setLoadingPayments(false); }
  }

  async function refreshWebhooks() {
    setLoadingWebhooks(true); setError(null); setInfo(null);
    try {
      const limitValue = normalizeLimit(limit);
      if (limitValue === null) { setError(`The limit must be an integer in the range${MIN_LIMIT}-${MAX_LIMIT}.`); return; }
      const params = new URLSearchParams({ limit: String(limitValue) });
      if (webhookStatus !== "ALL") params.set("status", webhookStatus);
      const response = await fetch(`/api/admin/webhooks?${params.toString()}`);
      const body = await response.json();
      if (!response.ok || !body.ok || !Array.isArray(body.data?.webhooks)) { setError(body.error?.message ?? "Webhook failed to load."); return; }
      setWebhooks(body.data.webhooks as WebhookRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally { setLoadingWebhooks(false); }
  }

  async function toggleTrialFlag(lessonId: string, trialEnabled: boolean) {
    setUpdatingLessonId(lessonId); setError(null); setInfo(null);
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}/trial-flag`, {
        method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ trialEnabled: !trialEnabled }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) { setError(body.error?.message ?? "Unable to update trial lesson status."); return; }
      setLessons((current) => current.map((lesson) => (lesson.id === lessonId ? { ...lesson, trialEnabled: !trialEnabled } : lesson)));
      setInfo("Updated trial status.");
      await logAdminAction({ action: "TOGGLE_TRIAL", target: lessonId, detail: { nextTrialEnabled: !trialEnabled } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally { setUpdatingLessonId(null); }
  }

  function openReconcilePanel(paymentId: string) {
    if (openReconcilePaymentId === paymentId) { setOpenReconcilePaymentId(null); return; }
    setOpenReconcilePaymentId(paymentId); setReconcileAction("SYNC_ENROLLMENTS"); setReconcileNote(""); setReconcileWebhookId(""); setReconcileWebhookResolution("NONE"); setError(null); setInfo(null);
  }

  async function submitReconcile(payment: PaymentRow) {
    setReconcilingPaymentId(payment.id); setError(null); setInfo(null);
    try {
      const payload: Record<string, unknown> = { action: reconcileAction };
      const trimmedNote = reconcileNote.trim();
      if (trimmedNote.length > 0) payload.note = trimmedNote;
      if (reconcileWebhookResolution !== "NONE") {
        if (!reconcileWebhookId) { setError("Select the webhook event when a webhook update occurs."); return; }
        payload.webhookEventId = reconcileWebhookId; payload.webhookResolution = reconcileWebhookResolution;
      }
      const response = await fetch(`/api/admin/payments/${payment.id}/reconcile`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as { ok?: boolean; error?: { message?: string }; data?: { payment?: { id: string; status: string; processedAt: string }; syncedEnrollmentCount?: number; webhookUpdate?: { id: string; status: string } | null } };
      if (!response.ok || !body.ok || !body.data?.payment) { setError(body.error?.message ?? "Manual reconciliation failed."); return; }
      setPayments((current) => current.map((item) => item.id === payment.id ? { ...item, status: body.data?.payment?.status ?? item.status, processedAt: body.data?.payment?.processedAt ?? item.processedAt } : item));
      if (body.data?.webhookUpdate) setWebhooks((current) => current.map((item) => item.id === body.data?.webhookUpdate?.id ? { ...item, status: body.data?.webhookUpdate?.status ?? item.status } : item));
      await logAdminAction({ action: "PAYMENT_MANUAL_RECONCILE", target: payment.id, detail: { reconcileAction, webhookEventId: reconcileWebhookId || null, webhookResolution: reconcileWebhookResolution === "NONE" ? null : reconcileWebhookResolution } });
      const syncedCount = body.data?.syncedEnrollmentCount ?? 0;
      setOpenReconcilePaymentId(null);
      await Promise.all([refreshPayments(), refreshWebhooks()]);
      setInfo(`Payment has been reconciled. Synchronized registration number:${syncedCount}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Manual reconciliation failed.");
    } finally { setReconcilingPaymentId(null); }
  }

  return {
    payments, webhooks, lessons, paymentStatus, webhookStatus, limit, loadingPayments, loadingWebhooks,
    updatingLessonId, openReconcilePaymentId, reconcileAction, reconcileWebhookResolution, reconcileWebhookId, reconcileNote,
    reconcilingPaymentId, error, info,
    setPaymentStatus, setWebhookStatus, setLimit, setReconcileAction, setReconcileWebhookResolution, setReconcileWebhookId, setReconcileNote, setOpenReconcilePaymentId,
    refreshPayments, refreshWebhooks, toggleTrialFlag, openReconcilePanel, submitReconcile,
  };
}
