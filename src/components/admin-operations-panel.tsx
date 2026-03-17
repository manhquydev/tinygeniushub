"use client";

import { Fragment, useState } from "react";

type PaymentRow = {
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

type WebhookRow = {
  id: string;
  provider: string;
  eventId: string;
  signatureValid: boolean;
  status: string;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
};

type LessonTrialRow = {
  id: string;
  slug: string;
  title: string;
  trialEnabled: boolean;
  trackCode: string;
};

interface AdminOperationsPanelProps {
  initialPayments: PaymentRow[];
  initialWebhooks: WebhookRow[];
  lessonTrialRows: LessonTrialRow[];
  defaultView?: "payments" | "webhooks" | "trials";
}

const paymentStatuses = ["ALL", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
const webhookStatuses = ["ALL", "RECEIVED", "PROCESSED", "IGNORED", "FAILED"] as const;
const reconcileActions = [
  "MARK_SUCCEEDED_AND_SYNC",
  "SYNC_ENROLLMENTS",
  "MARK_FAILED",
  "MARK_PENDING",
] as const;
const reconcileWebhookResolutions = ["NONE", "PROCESSED", "IGNORED"] as const;
const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

type ReconcileAction = (typeof reconcileActions)[number];
type ReconcileWebhookResolution = (typeof reconcileWebhookResolutions)[number];

function getPaymentStatusPillClass(status: string) {
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

function getPaymentStatusLabel(status: string) {
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

function getWebhookStatusPillClass(status: string) {
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

function normalizeLimit(limitRaw: string) {
  const parsed = Number.parseInt(limitRaw, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.min(Math.max(parsed, MIN_LIMIT), MAX_LIMIT);
}

function getWebhookStatusLabel(status: string) {
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

function getReconcileActionLabel(action: ReconcileAction) {
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

function getWebhookResolutionLabel(value: Exclude<ReconcileWebhookResolution, "NONE">) {
  if (value === "PROCESSED") return "Đã xử lý";
  return "Bỏ qua";
}

function matchWebhookToPayment(payment: PaymentRow, webhook: WebhookRow) {
  if (webhook.provider !== payment.provider) {
    return false;
  }

  if (payment.provider === "payos") {
    return webhook.eventId.startsWith(`${payment.providerTransactionId}:`);
  }

  return true;
}

export function AdminOperationsPanel({
  initialPayments,
  initialWebhooks,
  lessonTrialRows,
  defaultView = "payments",
}: AdminOperationsPanelProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [lessons, setLessons] = useState(lessonTrialRows);
  const [paymentStatus, setPaymentStatus] = useState<(typeof paymentStatuses)[number]>("ALL");
  const [webhookStatus, setWebhookStatus] = useState<(typeof webhookStatuses)[number]>("ALL");
  const [limit, setLimit] = useState(String(DEFAULT_LIMIT));
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [updatingLessonId, setUpdatingLessonId] = useState<string | null>(null);
  const [openReconcilePaymentId, setOpenReconcilePaymentId] = useState<string | null>(null);
  const [reconcileAction, setReconcileAction] = useState<ReconcileAction>("SYNC_ENROLLMENTS");
  const [reconcileNote, setReconcileNote] = useState("");
  const [reconcileWebhookId, setReconcileWebhookId] = useState("");
  const [reconcileWebhookResolution, setReconcileWebhookResolution] =
    useState<ReconcileWebhookResolution>("NONE");
  const [reconcilingPaymentId, setReconcilingPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function logAdminAction(input: {
    action: string;
    target?: string;
    detail?: unknown;
  }) {
    try {
      await fetch("/api/admin/log", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
        keepalive: true,
      });
    } catch {
      // Ghi log không được làm gián đoạn thao tác quản trị.
    }
  }

  async function refreshPayments() {
    setLoadingPayments(true);
    setError(null);
    setInfo(null);

    try {
      const limitValue = normalizeLimit(limit);
      if (limitValue === null) {
        setError(`Giới hạn phải là số nguyên trong khoảng ${MIN_LIMIT}-${MAX_LIMIT}.`);
        return;
      }

      const params = new URLSearchParams();
      params.set("limit", String(limitValue));
      if (paymentStatus !== "ALL") {
        params.set("status", paymentStatus);
      }

      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      const body = await response.json();

      if (!response.ok || !body.ok || !Array.isArray(body.data?.payments)) {
        setError(body.error?.message ?? "Không tải được giao dịch.");
        return;
      }

      setPayments(body.data.payments as PaymentRow[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Lỗi không xác định.");
    } finally {
      setLoadingPayments(false);
    }
  }

  async function refreshWebhooks() {
    setLoadingWebhooks(true);
    setError(null);
    setInfo(null);

    try {
      const limitValue = normalizeLimit(limit);
      if (limitValue === null) {
        setError(`Giới hạn phải là số nguyên trong khoảng ${MIN_LIMIT}-${MAX_LIMIT}.`);
        return;
      }

      const params = new URLSearchParams();
      params.set("limit", String(limitValue));
      if (webhookStatus !== "ALL") {
        params.set("status", webhookStatus);
      }

      const response = await fetch(`/api/admin/webhooks?${params.toString()}`);
      const body = await response.json();

      if (!response.ok || !body.ok || !Array.isArray(body.data?.webhooks)) {
        setError(body.error?.message ?? "Không tải được webhook.");
        return;
      }

      setWebhooks(body.data.webhooks as WebhookRow[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Lỗi không xác định.");
    } finally {
      setLoadingWebhooks(false);
    }
  }

  async function toggleTrialFlag(lessonId: string, trialEnabled: boolean) {
    setUpdatingLessonId(lessonId);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}/trial-flag`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          trialEnabled: !trialEnabled,
        }),
      });

      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không cập nhật được trạng thái bài học dùng thử.");
        return;
      }

      setLessons((current) =>
        current.map((lesson) => (lesson.id === lessonId ? { ...lesson, trialEnabled: !trialEnabled } : lesson)),
      );
      setInfo("Đã cập nhật trạng thái dùng thử.");
      await logAdminAction({
        action: "TOGGLE_TRIAL",
        target: lessonId,
        detail: {
          nextTrialEnabled: !trialEnabled,
        },
      });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Lỗi không xác định.");
    } finally {
      setUpdatingLessonId(null);
    }
  }

  function openReconcilePanel(paymentId: string) {
    if (openReconcilePaymentId === paymentId) {
      setOpenReconcilePaymentId(null);
      return;
    }

    setOpenReconcilePaymentId(paymentId);
    setReconcileAction("SYNC_ENROLLMENTS");
    setReconcileNote("");
    setReconcileWebhookId("");
    setReconcileWebhookResolution("NONE");
    setError(null);
    setInfo(null);
  }

  async function submitReconcile(payment: PaymentRow) {
    setReconcilingPaymentId(payment.id);
    setError(null);
    setInfo(null);

    try {
      const payload: Record<string, unknown> = {
        action: reconcileAction,
      };

      const trimmedNote = reconcileNote.trim();
      if (trimmedNote.length > 0) {
        payload.note = trimmedNote;
      }

      if (reconcileWebhookResolution !== "NONE") {
        if (!reconcileWebhookId) {
          setError("Hãy chọn sự kiện webhook khi có cập nhật webhook.");
          return;
        }
        payload.webhookEventId = reconcileWebhookId;
        payload.webhookResolution = reconcileWebhookResolution;
      }

      const response = await fetch(`/api/admin/payments/${payment.id}/reconcile`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string };
        data?: {
          payment?: {
            id: string;
            status: string;
            processedAt: string;
          };
          syncedEnrollmentCount?: number;
          webhookUpdate?: { id: string; status: string } | null;
        };
      };

      if (!response.ok || !body.ok || !body.data?.payment) {
        setError(body.error?.message ?? "Đối soát thủ công thất bại.");
        return;
      }

      setPayments((current) =>
        current.map((item) =>
          item.id === payment.id
            ? {
                ...item,
                status: body.data?.payment?.status ?? item.status,
                processedAt: body.data?.payment?.processedAt ?? item.processedAt,
              }
            : item,
        ),
      );

      if (body.data?.webhookUpdate) {
        setWebhooks((current) =>
          current.map((item) =>
            item.id === body.data?.webhookUpdate?.id
              ? {
                  ...item,
                  status: body.data?.webhookUpdate?.status ?? item.status,
                }
              : item,
          ),
        );
      }

      await logAdminAction({
        action: "PAYMENT_MANUAL_RECONCILE",
        target: payment.id,
        detail: {
          reconcileAction,
          webhookEventId: reconcileWebhookId || null,
          webhookResolution: reconcileWebhookResolution === "NONE" ? null : reconcileWebhookResolution,
        },
      });

      const syncedCount = body.data?.syncedEnrollmentCount ?? 0;
      setOpenReconcilePaymentId(null);

      await Promise.all([refreshPayments(), refreshWebhooks()]);
      setInfo(`Đã đối soát thanh toán. Số ghi danh đồng bộ: ${syncedCount}.`);
    } catch (reconcileError) {
      setError(reconcileError instanceof Error ? reconcileError.message : "Đối soát thủ công thất bại.");
    } finally {
      setReconcilingPaymentId(null);
    }
  }

  return (
    <section className="card page-stack">
      <h2>Vận hành hệ thống</h2>
      <p className="muted-text">Theo dõi thanh toán, webhook và bật tắt bài học dùng thử.</p>

      <div className="admin-controls">
        <label>
          Giới hạn bản ghi
          <input
            value={limit}
            type="number"
            min={MIN_LIMIT}
            max={MAX_LIMIT}
            onChange={(event) => setLimit(event.target.value)}
            placeholder={String(DEFAULT_LIMIT)}
          />
        </label>
        <label>
          Trạng thái thanh toán
          <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as typeof paymentStatus)}>
            {paymentStatuses.map((status) => (
              <option value={status} key={status}>
                {getPaymentStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghost-button" onClick={refreshPayments} disabled={loadingPayments}>
          {loadingPayments ? "Đang tải giao dịch..." : "Làm mới giao dịch"}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Phụ huynh</th>
              <th>Cổng thanh toán</th>
              <th>Mã giao dịch</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              <th>Thời điểm xử lý</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const isOpen = openReconcilePaymentId === payment.id;
              const relatedWebhooks = webhooks.filter((event) => matchWebhookToPayment(payment, event));
              const isReconciling = reconcilingPaymentId === payment.id;

              return (
                <Fragment key={payment.id}>
                  <tr key={payment.id}>
                    <td>{payment.parent.email}</td>
                    <td>{payment.provider}</td>
                    <td>{payment.providerTransactionId}</td>
                    <td>
                      {payment.amountVnd.toLocaleString("vi-VN")} {payment.currency}
                    </td>
                    <td>
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getPaymentStatusPillClass(
                          payment.status,
                        )}`}
                      >
                        {getPaymentStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td>{new Date(payment.processedAt).toLocaleString("vi-VN")}</td>
                    <td>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => openReconcilePanel(payment.id)}
                        disabled={isReconciling}
                      >
                        {isOpen ? "Đóng đối soát" : "Đối soát thủ công"}
                      </button>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <label>
                              Hành động
                              <select
                                value={reconcileAction}
                                onChange={(event) => setReconcileAction(event.target.value as ReconcileAction)}
                              >
                                {reconcileActions.map((action) => (
                                  <option key={action} value={action}>
                                    {getReconcileActionLabel(action)}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label>
                              Cập nhật webhook
                              <select
                                value={reconcileWebhookResolution}
                                onChange={(event) =>
                                  setReconcileWebhookResolution(event.target.value as ReconcileWebhookResolution)
                                }
                              >
                                <option value="NONE">Không cập nhật webhook</option>
                                {reconcileWebhookResolutions
                                  .filter((value): value is Exclude<ReconcileWebhookResolution, "NONE"> => value !== "NONE")
                                  .map((value) => (
                                    <option key={value} value={value}>
                                      {getWebhookResolutionLabel(value)}
                                    </option>
                                  ))}
                              </select>
                            </label>

                            <label className="md:col-span-2">
                              Chọn webhook liên quan
                              <select
                                value={reconcileWebhookId}
                                onChange={(event) => setReconcileWebhookId(event.target.value)}
                                disabled={reconcileWebhookResolution === "NONE"}
                              >
                                <option value="">-- Chọn sự kiện webhook --</option>
                                {relatedWebhooks.map((event) => (
                                  <option key={event.id} value={event.id}>
                                    {event.eventId} ({event.status})
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="md:col-span-2">
                              Ghi chú vận hành
                              <textarea
                                value={reconcileNote}
                                onChange={(event) => setReconcileNote(event.target.value)}
                                placeholder="Ví dụ: webhook về trễ, cần mở khóa thủ công cho phụ huynh..."
                                rows={3}
                              />
                            </label>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="solid-button"
                              onClick={() => submitReconcile(payment)}
                              disabled={isReconciling}
                            >
                              {isReconciling ? "Đang đối soát..." : "Thực hiện đối soát"}
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() => setOpenReconcilePaymentId(null)}
                              disabled={isReconciling}
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7}>Chưa có bản ghi thanh toán.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="admin-controls">
        <label>
          Trạng thái webhook
          <select value={webhookStatus} onChange={(event) => setWebhookStatus(event.target.value as typeof webhookStatus)}>
            {webhookStatuses.map((status) => (
              <option value={status} key={status}>
                {getWebhookStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghost-button" onClick={refreshWebhooks} disabled={loadingWebhooks}>
          {loadingWebhooks ? "Đang tải webhook..." : "Làm mới webhook"}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nhà cung cấp</th>
              <th>Sự kiện</th>
              <th>Trạng thái</th>
              <th>Chữ ký</th>
              <th>Lỗi</th>
              <th>Thời điểm tạo</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((event) => (
              <tr key={event.id}>
                <td>{event.provider}</td>
                <td>{event.eventId}</td>
                <td>
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getWebhookStatusPillClass(
                      event.status,
                    )}`}
                  >
                    {getWebhookStatusLabel(event.status)}
                  </span>
                </td>
                <td>{event.signatureValid ? "Hợp lệ" : "Không hợp lệ"}</td>
                <td>{event.errorMessage ?? "-"}</td>
                <td>{new Date(event.createdAt).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
            {webhooks.length === 0 ? (
              <tr>
                <td colSpan={6}>Chưa có bản ghi webhook.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="page-stack">
        <h3>Bài học dùng thử</h3>
        <div className="admin-lesson-list">
          {lessons.map((lesson) => (
            <article key={lesson.id} className="list-item">
              <div>
                <strong>{lesson.title}</strong>
                <p className="muted-text">
                  {lesson.slug} - {lesson.trackCode} - dùng thử {lesson.trialEnabled ? "BẬT" : "TẮT"}
                </p>
              </div>
              <button
                type="button"
                className={lesson.trialEnabled ? "danger-button" : "solid-button"}
                onClick={() => toggleTrialFlag(lesson.id, lesson.trialEnabled)}
                disabled={updatingLessonId === lesson.id}
              >
                {updatingLessonId === lesson.id
                  ? "Đang cập nhật..."
                  : lesson.trialEnabled
                    ? "Tắt dùng thử"
                    : "Bật dùng thử"}
              </button>
            </article>
          ))}
          {lessons.length === 0 ? <p className="muted-text">Chưa có bài học nào.</p> : null}
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </section>
  );
}
