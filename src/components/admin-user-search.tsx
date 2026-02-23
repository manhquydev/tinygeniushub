"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Eye, Search, SearchX } from "lucide-react";

type ApiResponse<TData> = {
  ok: boolean;
  data?: TData;
  error?: {
    message?: string;
  };
};

type BulkAction = "SUSPEND" | "ACTIVATE" | "SEND_NOTIFICATION";

type AdminUserSearchRow = {
  id: string;
  email: string;
  displayName: string | null;
  suspended: boolean;
  createdAt: string;
  subscription: {
    status: string | null;
  };
  childProfiles: {
    count: number;
    nicknames: string[];
  };
  successfulPaymentsCount: number;
};

type AdminUserDetail = {
  parent: {
    id: string;
    email: string;
    displayName: string | null;
    suspended: boolean;
    createdAt: string;
    lastActiveAt: string | null;
    notificationCount: number;
  };
  currentSubscription: {
    id: string;
    planCode: string;
    status: string;
    childProfileLimit: number;
    caregiverLimit: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    autoRenew: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  subscriptionHistory: Array<{
    id: string;
    provider: string;
    providerTransactionId: string;
    amountVnd: number;
    status: string;
    processedAt: string;
    planCode: string | null;
    eventType: string | null;
  }>;
  children: Array<{
    id: string;
    nickname: string;
    createdAt: string;
    lessonsCompleted30d: number;
  }>;
  paymentHistory: Array<{
    id: string;
    provider: string;
    providerTransactionId: string;
    amountVnd: number;
    currency: string;
    status: string;
    processedAt: string;
  }>;
  caregiverInvites: Array<{
    id: string;
    email: string;
    accepted: boolean;
    createdAt: string;
    expiresAt: string;
  }>;
};

type AdminNote = {
  id: string;
  parentId: string;
  note: string;
  createdAt: string;
  createdBy: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("vi-VN");
}

function normalizeStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "NO_SUBSCRIPTION";
  }

  return status;
}

function getSubscriptionBadgeClass(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE_STANDARD":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "TRIALING":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "GRACE":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "ACTIVE_FAMILYPLUS":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "CANCELED_AT_PERIOD_END":
    case "CANCELED":
    case "EXPIRED":
    case "REFUNDED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function toCurrency(amountVnd: number) {
  return amountVnd.toLocaleString("vi-VN");
}

export function AdminUserSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserSearchRow[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("SUSPEND");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResultMessage, setBulkResultMessage] = useState<string | null>(null);
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [notesReloadToken, setNotesReloadToken] = useState(0);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedParentId) ?? null,
    [selectedParentId, users],
  );

  const allRowsSelected = users.length > 0 && users.every((user) => selectedParentIds.includes(user.id));

  useEffect(() => {
    setSelectedParentIds((current) => current.filter((id) => users.some((user) => user.id === id)));
  }, [users]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      setUsers([]);
      setSearchError(null);
      setSelectedParentId(null);
      setDetail(null);
      setDetailError(null);
      setSelectedParentIds([]);
      setBulkResultMessage(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setSearchLoading(true);
        setSearchError(null);

        try {
          const params = new URLSearchParams();
          params.set("q", trimmedQuery);
          params.set("limit", "20");

          const response = await fetch(`/api/admin/users/search?${params.toString()}`, {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          });
          const body = (await response.json()) as ApiResponse<{ users?: AdminUserSearchRow[] }>;

          if (!response.ok || !body.ok) {
            setSearchError(body.error?.message ?? "Không tải được danh sách người dùng.");
            setUsers([]);
            setSelectedParentId(null);
            setDetail(null);
            return;
          }

          const rows = body.data?.users ?? [];
          setUsers(rows);

          if (rows.length === 0) {
            setSelectedParentId(null);
            setDetail(null);
            return;
          }

          setSelectedParentId((current) =>
            current && rows.some((row) => row.id === current) ? current : (rows[0]?.id ?? null),
          );
        } catch (fetchError) {
          if (fetchError instanceof Error && fetchError.name === "AbortError") {
            return;
          }

          setSearchError(fetchError instanceof Error ? fetchError.message : "Lỗi không xác định.");
          setUsers([]);
          setSelectedParentId(null);
          setDetail(null);
        } finally {
          setSearchLoading(false);
        }
      })();
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    if (!selectedParentId) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    const controller = new AbortController();
    void (async () => {
      setDetailLoading(true);
      setDetailError(null);

      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(selectedParentId)}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        const body = (await response.json()) as ApiResponse<{ detail?: AdminUserDetail }>;

        if (!response.ok || !body.ok || !body.data?.detail) {
          setDetailError(body.error?.message ?? "Không tải được thông tin chi tiết.");
          setDetail(null);
          return;
        }

        setDetail(body.data.detail);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }

        setDetailError(fetchError instanceof Error ? fetchError.message : "Lỗi không xác định.");
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [selectedParentId]);

  useEffect(() => {
    if (!selectedParentId) {
      setNotes([]);
      setNotesError(null);
      setNoteDraft("");
      return;
    }

    const controller = new AbortController();
    void (async () => {
      setNotesLoading(true);
      setNotesError(null);

      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(selectedParentId)}/notes`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        const body = (await response.json()) as ApiResponse<{ notes?: AdminNote[] }>;

        if (!response.ok || !body.ok) {
          setNotesError(body.error?.message ?? "Không tải được ghi chú nội bộ.");
          setNotes([]);
          return;
        }

        setNotes(body.data?.notes ?? []);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }

        setNotesError(fetchError instanceof Error ? fetchError.message : "Lỗi không xác định.");
        setNotes([]);
      } finally {
        setNotesLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [notesReloadToken, selectedParentId]);

  function toggleRowSelected(parentId: string, checked: boolean) {
    setSelectedParentIds((current) => {
      if (checked) {
        return current.includes(parentId) ? current : [...current, parentId];
      }

      return current.filter((id) => id !== parentId);
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedParentIds(checked ? users.map((user) => user.id) : []);
  }

  async function handleBulkAction() {
    if (selectedParentIds.length === 0) {
      return;
    }

    const confirmMessage = `Bạn có chắc muốn thực hiện ${bulkAction} cho ${selectedParentIds.length} người dùng?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBulkLoading(true);
    setBulkResultMessage(null);

    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          parentIds: selectedParentIds,
          action: bulkAction,
          payload:
            bulkAction === "SEND_NOTIFICATION"
              ? {
                  message: bulkMessage.trim() || undefined,
                }
              : undefined,
        }),
      });

      const body = (await response.json()) as ApiResponse<{ succeeded?: number; failed?: number }>;
      if (!response.ok || !body.ok) {
        setBulkResultMessage(body.error?.message ?? "Không thực hiện được bulk action.");
        return;
      }

      const succeeded = body.data?.succeeded ?? 0;
      const failed = body.data?.failed ?? 0;
      setBulkResultMessage(`${succeeded} thành công, ${failed} thất bại.`);

      setUsers((current) =>
        current.map((user) => {
          if (!selectedParentIds.includes(user.id)) {
            return user;
          }

          if (bulkAction === "SUSPEND") {
            return { ...user, suspended: true };
          }

          if (bulkAction === "ACTIVATE") {
            return { ...user, suspended: false };
          }

          return user;
        }),
      );
    } catch (bulkError) {
      setBulkResultMessage(bulkError instanceof Error ? bulkError.message : "Lỗi không xác định.");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleImpersonate(parentId: string) {
    if (!window.confirm("Bắt đầu xem dưới quyền người dùng này?")) {
      return;
    }

    setImpersonateLoading(true);
    setDetailError(null);

    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ parentId }),
      });
      const body = (await response.json()) as ApiResponse<{ redirectTo?: string }>;

      if (!response.ok || !body.ok) {
        setDetailError(body.error?.message ?? "Không thể chuyển sang chế độ xem người dùng.");
        return;
      }

      const redirectTo = body.data?.redirectTo ?? "/parent/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch (impersonateError) {
      setDetailError(impersonateError instanceof Error ? impersonateError.message : "Lỗi không xác định.");
    } finally {
      setImpersonateLoading(false);
    }
  }

  async function handleCreateNote() {
    if (!selectedParentId) {
      return;
    }

    const note = noteDraft.trim();
    if (note.length === 0) {
      setNotesError("Vui lòng nhập nội dung ghi chú.");
      return;
    }

    setNoteSubmitting(true);
    setNotesError(null);

    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(selectedParentId)}/notes`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ note }),
      });
      const body = (await response.json()) as ApiResponse<{ note?: AdminNote }>;

      if (!response.ok || !body.ok) {
        setNotesError(body.error?.message ?? "Không thể thêm ghi chú.");
        return;
      }

      setNoteDraft("");
      setNotesReloadToken((current) => current + 1);
    } catch (createNoteError) {
      setNotesError(createNoteError instanceof Error ? createNoteError.message : "Lỗi không xác định.");
    } finally {
      setNoteSubmitting(false);
    }
  }

  return (
    <section className="card page-stack">
      <h2>Tìm kiếm người dùng</h2>
      <p className="muted-text">Nhập email phụ huynh để tìm nhanh thông tin gói đăng ký, hồ sơ bé và thanh toán.</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Tìm theo email phụ huynh..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả"
                      checked={allRowsSelected}
                      onChange={(event) => toggleSelectAll(event.target.checked)}
                    />
                  </th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Gói</th>
                  <th className="px-3 py-2">Số bé</th>
                  <th className="px-3 py-2">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody>
                {searchLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <tr key={`skeleton-${index}`} className="border-t border-slate-100">
                        <td className="px-3 py-3">
                          <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                        </td>
                      </tr>
                    ))
                  : null}

                {!searchLoading && users.length > 0
                  ? users.map((user) => {
                      const isActive = selectedParentId === user.id;
                      const isChecked = selectedParentIds.includes(user.id);

                      return (
                        <tr
                          key={user.id}
                          className={`cursor-pointer border-t border-slate-100 transition hover:bg-teal-50/40 ${
                            isActive ? "bg-teal-50/70" : ""
                          }`}
                          onClick={() => setSelectedParentId(user.id)}
                        >
                          <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(event) => toggleRowSelected(user.id, event.target.checked)}
                              aria-label={`Chọn ${user.email}`}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-semibold text-slate-800">{user.email}</p>
                            <p className="text-xs text-slate-500">{user.displayName ?? "Không có tên hiển thị"}</p>
                            {user.suspended ? (
                              <span className="mt-1 inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                                Đang tạm khóa
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getSubscriptionBadgeClass(
                                user.subscription.status,
                              )}`}
                            >
                              {normalizeStatusLabel(user.subscription.status)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-700">{user.childProfiles.count}</td>
                          <td className="px-3 py-3 text-slate-700">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                        </tr>
                      );
                    })
                  : null}
              </tbody>
            </table>
          </div>

          {selectedParentIds.length > 0 ? (
            <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-3">
              <p className="text-sm font-semibold text-teal-700">Đã chọn {selectedParentIds.length} người dùng</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(event) => setBulkAction(event.target.value as BulkAction)}
                  className="rounded-lg border border-teal-300 bg-white px-2 py-1 text-sm text-slate-700"
                >
                  <option value="SUSPEND">Tạm khóa</option>
                  <option value="ACTIVATE">Kích hoạt lại</option>
                  <option value="SEND_NOTIFICATION">Gửi thông báo</option>
                </select>

                {bulkAction === "SEND_NOTIFICATION" ? (
                  <input
                    value={bulkMessage}
                    onChange={(event) => setBulkMessage(event.target.value)}
                    type="text"
                    placeholder="Nội dung thông báo"
                    className="min-w-[240px] flex-1 rounded-lg border border-teal-300 bg-white px-2 py-1 text-sm text-slate-700"
                  />
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    void handleBulkAction();
                  }}
                  disabled={bulkLoading}
                  className="inline-flex min-h-9 items-center justify-center rounded-full bg-teal-600 px-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {bulkLoading ? "Đang xử lý..." : "Thực hiện"}
                </button>
              </div>

              {bulkResultMessage ? <p className="mt-2 text-sm text-teal-700">{bulkResultMessage}</p> : null}
            </div>
          ) : null}

          {!searchLoading && query.trim().length > 0 && users.length === 0 && !searchError ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
              <SearchX size={32} className="mx-auto mb-2 text-slate-300" />
              <p>Không tìm thấy phụ huynh nào phù hợp.</p>
            </div>
          ) : null}

          {searchError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{searchError}</p>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          {!selectedParentId ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Chọn một phụ huynh để xem chi tiết.
            </p>
          ) : null}

          {detailLoading ? (
            <div className="space-y-3">
              <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
              <div className="h-20 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ) : null}

          {detailError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{detailError}</p>
          ) : null}

          {!detailLoading && !detailError && detail ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{detail.parent.displayName ?? detail.parent.email}</h3>
                <p className="text-xs text-slate-500">{detail.parent.email}</p>
                <p className="mt-1 text-xs text-slate-500">Ngày tham gia: {formatDate(detail.parent.createdAt)}</p>
                {detail.parent.suspended ? (
                  <p className="mt-1 text-xs font-semibold text-rose-700">Tài khoản đang bị tạm khóa</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => {
                  void handleImpersonate(detail.parent.id);
                }}
                disabled={impersonateLoading}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-800 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {impersonateLoading ? (
                  "Đang chuyển..."
                ) : (
                  <>
                    <Eye size={14} className="shrink-0" />
                    <span>Xem như người dùng này</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <p className="text-slate-500">Thông báo</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">{detail.parent.notificationCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <p className="text-slate-500">Giao dịch thành công</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">{selectedUser?.successfulPaymentsCount ?? 0}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Gói đăng ký</p>
                {detail.currentSubscription ? (
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold">Gói:</span> {detail.currentSubscription.planCode}
                    </p>
                    <p>
                      <span className="font-semibold">Trạng thái:</span> {detail.currentSubscription.status}
                    </p>
                    <p>
                      <span className="font-semibold">Kỳ hạn:</span> {formatDate(detail.currentSubscription.currentPeriodStart)} -{" "}
                      {formatDate(detail.currentSubscription.currentPeriodEnd)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Chưa có gói đăng ký.</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Lịch sử gói đăng ký</p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                  {detail.subscriptionHistory.slice(0, 8).map((item) => (
                    <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="font-semibold">
                        {item.planCode ?? "Gói không xác định"} - {item.status}
                      </p>
                      <p className="text-slate-500">
                        {item.provider} / {item.providerTransactionId} - {formatDate(item.processedAt)}
                      </p>
                    </li>
                  ))}
                  {detail.subscriptionHistory.length === 0 ? (
                    <li className="text-slate-500">Chưa có lịch sử.</li>
                  ) : null}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Bé (hoạt động 30 ngày)</p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  {detail.children.map((child) => (
                    <li key={child.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      {child.nickname} - {child.lessonsCompleted30d} bài / 30 ngày
                    </li>
                  ))}
                  {detail.children.length === 0 ? <li className="text-slate-500">Chưa có hồ sơ bé.</li> : null}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Lịch sử thanh toán (10 gần nhất)</p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                  {detail.paymentHistory.map((payment) => (
                    <li key={payment.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="font-semibold">
                        {toCurrency(payment.amountVnd)} {payment.currency} - {payment.status}
                      </p>
                      <p className="text-slate-500">{payment.provider} - {formatDate(payment.processedAt)}</p>
                    </li>
                  ))}
                  {detail.paymentHistory.length === 0 ? <li className="text-slate-500">Chưa có giao dịch.</li> : null}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Lời mời người chăm sóc</p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                  {detail.caregiverInvites.map((invite) => (
                    <li key={invite.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="font-semibold">{invite.email}</p>
                      <p className="text-slate-500">
                        {invite.accepted ? "Đã chấp nhận" : "Đang chờ"} - hết hạn {formatDate(invite.expiresAt)}
                      </p>
                    </li>
                  ))}
                  {detail.caregiverInvites.length === 0 ? <li className="text-slate-500">Chưa có lời mời.</li> : null}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Ghi chú nội bộ</p>

                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value.slice(0, 500))}
                    rows={3}
                    maxLength={500}
                    placeholder="Nhập ghi chú CRM nội bộ..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-400"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">{500 - noteDraft.length} ký tự còn lại</p>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCreateNote();
                      }}
                      disabled={noteSubmitting}
                      className="inline-flex min-h-9 items-center justify-center rounded-full bg-teal-600 px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {noteSubmitting ? "Đang lưu..." : "Thêm ghi chú"}
                    </button>
                  </div>
                </div>

                {notesError ? (
                  <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-medium text-rose-700">
                    {notesError}
                  </p>
                ) : null}

                {notesLoading ? (
                  <div className="mt-2 space-y-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div
                        key={`note-skeleton-${index}`}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                      >
                        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                        <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-100" />
                      </div>
                    ))}
                  </div>
                ) : null}

                {!notesLoading ? (
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                    {notes.map((adminNote) => (
                      <li key={adminNote.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <p className="font-semibold">
                          {adminNote.createdBy} • {formatDate(adminNote.createdAt)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-slate-600">{adminNote.note}</p>
                      </li>
                    ))}
                    {notes.length === 0 ? <li className="text-slate-500">Chưa có ghi chú.</li> : null}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
