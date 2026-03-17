"use client";

export type PaymentRow = {
  id: string;
  provider: string;
  providerTransactionId: string;
  amountVnd: number;
  currency: string;
  status: string;
  processedAt: string;
  parent: {
    email: string;
  };
};

export type WebhookRow = {
  id: string;
  provider: string;
  eventId: string;
  signatureValid: boolean;
  status: string;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type LessonTrialRow = {
  id: string;
  slug: string;
  title: string;
  trialEnabled: boolean;
  trackCode: string;
};

export interface AdminOperationsPanelProps {
  initialPayments: PaymentRow[];
  initialWebhooks: WebhookRow[];
  lessonTrialRows: LessonTrialRow[];
  defaultView?: "payments" | "webhooks" | "trials";
}

export type ReconcileAction =
  | "MARK_SUCCEEDED_AND_SYNC"
  | "SYNC_ENROLLMENTS"
  | "MARK_FAILED"
  | "MARK_PENDING";

export type ReconcileWebhookResolution = "NONE" | "PROCESSED" | "IGNORED";
