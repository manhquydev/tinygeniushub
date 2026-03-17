import {
  MAX_LIMIT,
  MIN_LIMIT,
} from "./admin-operations-constants";
import type {
  PaymentRow,
  ReconcileAction,
  ReconcileWebhookResolution,
  WebhookRow,
} from "./admin-operations-types";

export function getPaymentStatusPillClass(status: string) {
  switch (status) {
    case "SUCCEEDED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "REFUNDED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getPaymentStatusLabel(status: string) {
  switch (status) {
    case "ALL":
      return "Tất cả";
    case "PENDING":
      return "Chờ xử lý";
    case "SUCCEEDED":
      return "Thành công";
    case "FAILED":
      return "Thất bại";
    case "REFUNDED":
      return "Hoàn tiền";
    default:
      return status;
  }
}

export function getWebhookStatusPillClass(status: string) {
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

export function normalizeLimit(limitRaw: string) {
  const parsed = Number.parseInt(limitRaw, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.min(Math.max(parsed, MIN_LIMIT), MAX_LIMIT);
}

export function getWebhookStatusLabel(status: string) {
  switch (status) {
    case "ALL":
      return "Tất cả";
    case "RECEIVED":
      return "Đã nhận";
    case "PROCESSED":
      return "Đã xử lý";
    case "IGNORED":
      return "Bỏ qua";
    case "FAILED":
      return "Thất bại";
    default:
      return status;
  }
}

export function getReconcileActionLabel(action: ReconcileAction) {
  switch (action) {
    case "MARK_SUCCEEDED_AND_SYNC":
      return "Đánh dấu thành công + đồng bộ ghi danh";
    case "SYNC_ENROLLMENTS":
      return "Đồng bộ ghi danh (giữ trạng thái hiện tại)";
    case "MARK_FAILED":
      return "Đánh dấu thất bại";
    case "MARK_PENDING":
      return "Đánh dấu chờ xử lý";
    default:
      return action;
  }
}

export function getWebhookResolutionLabel(value: Exclude<ReconcileWebhookResolution, "NONE">) {
  if (value === "PROCESSED") return "Đã xử lý";
  return "Bỏ qua";
}

export function matchWebhookToPayment(payment: PaymentRow, webhook: WebhookRow) {
  if (webhook.provider !== payment.provider) {
    return false;
  }

  if (payment.provider === "payos") {
    return webhook.eventId.startsWith(`${payment.providerTransactionId}:`);
  }

  return true;
}
