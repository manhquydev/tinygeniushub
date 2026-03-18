"use client";

import { Eye } from "lucide-react";
import type { ReactNode } from "react";
import { formatDate, toCurrency } from "./admin-users-management-utils";
import type { AdminNote, AdminUserDetail, AdminUsersListRow } from "./admin-users-management-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminLoadingSkeleton } from "@/components/admin/ui/admin-loading-skeleton";

function SimpleListBlock({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)] mb-2">{title}</p>
      <div>{children || <p className="text-sm text-[var(--admin-text-secondary)]">{empty}</p>}</div>
    </div>
  );
}

type AdminUserDetailPaneProps = {
  selectedParentId: string | null;
  selectedUser: AdminUsersListRow | null;
  detail: AdminUserDetail | null;
  detailLoading: boolean;
  detailError: string | null;
  impersonateLoading: boolean;
  subscriptionActionLoading: boolean;
  subscriptionActionFeedback: string | null;
  extendDays: string;
  manualEmailSubject: string;
  manualEmailBody: string;
  manualEmailLoading: boolean;
  manualEmailFeedback: string | null;
  notes: AdminNote[];
  notesLoading: boolean;
  notesError: string | null;
  noteDraft: string;
  noteSubmitting: boolean;
  onExtendDaysChange: (next: string) => void;
  onManualEmailSubjectChange: (next: string) => void;
  onManualEmailBodyChange: (next: string) => void;
  onNoteDraftChange: (next: string) => void;
  onImpersonate: (parentId: string) => Promise<void>;
  onSubscriptionAction: (action: "extend" | "cancel" | "activate") => Promise<void>;
  onSendManualEmail: () => Promise<void>;
  onCreateNote: () => Promise<void>;
};

export function AdminUserDetailPane(props: AdminUserDetailPaneProps) {
  return (
    <aside className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 overflow-y-auto">
      {!props.selectedParentId && (
        <p className="rounded-xl border border-dashed border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-4 text-sm text-[var(--admin-text-secondary)] text-center">
          Chọn một phụ huynh để xem chi tiết.
        </p>
      )}
      {props.detailLoading && <AdminLoadingSkeleton variant="table" count={4} />}
      {props.detailError && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{props.detailError}</p>
      )}
      {!props.detailLoading && !props.detailError && props.detail && (
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h3 className="text-base font-bold text-[var(--admin-text-primary)]">{props.detail.parent.displayName ?? props.detail.parent.email}</h3>
            <p className="text-xs text-[var(--admin-text-secondary)]">{props.detail.parent.email}</p>
            <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">Ngày tham gia: {formatDate(props.detail.parent.createdAt)}</p>
            {props.detail.parent.suspended && <p className="mt-1 text-xs font-semibold text-rose-700">Tài khoản đang bị tạm khóa</p>}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void props.onImpersonate(props.detail!.parent.id)}
            disabled={props.impersonateLoading}
            className="gap-1.5 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          >
            <Eye size={14} />
            {props.impersonateLoading ? "Đang chuyển..." : "Xem như người dùng này"}
          </Button>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-2">
              <p className="text-[var(--admin-text-secondary)]">Thông báo</p>
              <p className="mt-1 text-lg font-bold text-[var(--admin-text-primary)]">{props.detail.parent.notificationCount}</p>
            </div>
            <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-2">
              <p className="text-[var(--admin-text-secondary)]">Giao dịch thành công</p>
              <p className="mt-1 text-lg font-bold text-[var(--admin-text-primary)]">{props.selectedUser?.successfulPaymentsCount ?? 0}</p>
            </div>
          </div>

          {/* Subscription */}
          <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">Gói đăng ký</p>
            {props.detail.currentSubscription ? (
              <div className="space-y-0.5 text-sm text-[var(--admin-text-secondary)]">
                <p><span className="font-semibold">Gói:</span> {props.detail.currentSubscription.planCode}</p>
                <p><span className="font-semibold">Trạng thái:</span> {props.detail.currentSubscription.status}</p>
                <p><span className="font-semibold">Kỳ hạn:</span> {formatDate(props.detail.currentSubscription.currentPeriodStart)} - {formatDate(props.detail.currentSubscription.currentPeriodEnd)}</p>
              </div>
            ) : (
              <p className="text-sm text-[var(--admin-text-secondary)]">Chưa có gói đăng ký.</p>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--admin-card-border)] pt-2">
              <Input
                type="number"
                min={1}
                max={3650}
                value={props.extendDays}
                onChange={(e) => props.onExtendDaysChange(e.target.value)}
                className="w-24 h-8 text-xs"
              />
              <Button size="sm" onClick={() => void props.onSubscriptionAction("extend")} disabled={props.subscriptionActionLoading || !props.detail.currentSubscription} className="h-7 text-xs bg-teal-600 hover:bg-teal-700">Gia hạn</Button>
              <Button variant="outline" size="sm" onClick={() => void props.onSubscriptionAction("cancel")} disabled={props.subscriptionActionLoading || !props.detail.currentSubscription} className="h-7 text-xs border-amber-300 text-amber-800">Hủy cuối kỳ</Button>
              <Button variant="outline" size="sm" onClick={() => void props.onSubscriptionAction("activate")} disabled={props.subscriptionActionLoading || !props.detail.currentSubscription} className="h-7 text-xs border-emerald-300 text-emerald-800">Kích hoạt</Button>
            </div>
            {props.subscriptionActionFeedback && <p className="text-xs text-[var(--admin-text-secondary)]">{props.subscriptionActionFeedback}</p>}
          </div>

          {/* Email */}
          <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">Gửi email thủ công</p>
            <Input value={props.manualEmailSubject} onChange={(e) => props.onManualEmailSubjectChange(e.target.value.slice(0, 200))} placeholder="Tiêu đề email" className="text-sm h-8" />
            <Textarea value={props.manualEmailBody} onChange={(e) => props.onManualEmailBodyChange(e.target.value.slice(0, 5000))} rows={3} placeholder="Nội dung email..." className="text-sm" />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[var(--admin-text-secondary)]">{5000 - props.manualEmailBody.length} ký tự còn lại</p>
              <Button size="sm" onClick={() => void props.onSendManualEmail()} disabled={props.manualEmailLoading} className="h-7 text-xs bg-teal-600 hover:bg-teal-700">
                {props.manualEmailLoading ? "Đang gửi..." : "Gửi email"}
              </Button>
            </div>
            {props.manualEmailFeedback && <p className="text-xs text-[var(--admin-text-secondary)]">{props.manualEmailFeedback}</p>}
          </div>

          {/* Lists */}
          <SimpleListBlock title="Lịch sử gói đăng ký" empty="Chưa có lịch sử.">
            {props.detail.subscriptionHistory.slice(0, 8).map((item) => (
              <div key={item.id} className="mb-1.5 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-2.5 py-2 text-xs">
                <p className="font-semibold text-[var(--admin-text-primary)]">{item.planCode ?? "Gói không xác định"} - {item.status}</p>
                <p className="text-[var(--admin-text-secondary)]">{item.provider} / {item.providerTransactionId} - {formatDate(item.processedAt)}</p>
              </div>
            ))}
          </SimpleListBlock>

          <SimpleListBlock title="Bé (hoạt động 30 ngày)" empty="Chưa có hồ sơ bé.">
            {props.detail.children.map((child) => (
              <div key={child.id} className="mb-1.5 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-2.5 py-2 text-sm text-[var(--admin-text-secondary)]">
                {child.nickname} - {child.lessonsCompleted30d} bài / 30 ngày
              </div>
            ))}
          </SimpleListBlock>

          <SimpleListBlock title="Lịch sử thanh toán (10 gần nhất)" empty="Chưa có giao dịch.">
            {props.detail.paymentHistory.map((payment) => (
              <div key={payment.id} className="mb-1.5 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-2.5 py-2 text-xs">
                <p className="font-semibold text-[var(--admin-text-primary)]">{toCurrency(payment.amountVnd)} {payment.currency} - {payment.status}</p>
                <p className="text-[var(--admin-text-secondary)]">{payment.provider} - {formatDate(payment.processedAt)}</p>
              </div>
            ))}
          </SimpleListBlock>

          <SimpleListBlock title="Lời mời người chăm sóc" empty="Chưa có lời mời.">
            {props.detail.caregiverInvites.map((invite) => (
              <div key={invite.id} className="mb-1.5 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-2.5 py-2 text-xs">
                <p className="font-semibold text-[var(--admin-text-primary)]">{invite.email}</p>
                <p className="text-[var(--admin-text-secondary)]">{invite.accepted ? "Đã chấp nhận" : "Đang chờ"} - hết hạn {formatDate(invite.expiresAt)}</p>
              </div>
            ))}
          </SimpleListBlock>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)] mb-2">Ghi chú nội bộ</p>
            <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-3 space-y-2">
              <Textarea
                value={props.noteDraft}
                onChange={(e) => props.onNoteDraftChange(e.target.value.slice(0, 500))}
                rows={3}
                maxLength={500}
                placeholder="Nhập ghi chú CRM nội bộ..."
                className="text-sm bg-[var(--admin-header-bg)]"
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--admin-text-secondary)]">{500 - props.noteDraft.length} ký tự còn lại</p>
                <Button size="sm" onClick={() => void props.onCreateNote()} disabled={props.noteSubmitting} className="h-7 text-xs bg-teal-600 hover:bg-teal-700">
                  {props.noteSubmitting ? "Đang lưu..." : "Thêm ghi chú"}
                </Button>
              </div>
              {props.notesError && <p className="text-xs text-rose-700">{props.notesError}</p>}
            </div>
            {props.notesLoading && <p className="mt-2 text-xs text-[var(--admin-text-secondary)]">Đang tải ghi chú...</p>}
            <div className="mt-2 space-y-1.5">
              {props.notes.map((note) => (
                <article key={note.id} className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-2.5 py-2 text-xs">
                  <p className="text-[var(--admin-text-secondary)]">{note.note}</p>
                  <p className="mt-1 text-[var(--admin-text-muted)]">{note.createdBy} - {formatDate(note.createdAt)}</p>
                </article>
              ))}
              {!props.notesLoading && props.notes.length === 0 && <p className="text-xs text-[var(--admin-text-secondary)]">Chưa có ghi chú.</p>}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
