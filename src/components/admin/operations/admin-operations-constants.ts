import type { ReconcileAction, ReconcileWebhookResolution } from "./admin-operations-types";

export const paymentStatuses = ["ALL", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
export const webhookStatuses = ["ALL", "RECEIVED", "PROCESSED", "IGNORED", "FAILED"] as const;
export const reconcileActions: ReconcileAction[] = [
  "MARK_SUCCEEDED_AND_SYNC",
  "SYNC_ENROLLMENTS",
  "MARK_FAILED",
  "MARK_PENDING",
];
export const reconcileWebhookResolutions: ReconcileWebhookResolution[] = ["NONE", "PROCESSED", "IGNORED"];

export const DEFAULT_LIMIT = 20;
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 100;
