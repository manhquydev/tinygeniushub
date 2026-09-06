"use client";

import { Eye } from "lucide-react";
import type { ReactNode } from "react";
import { formatDate, toCurrency } from "./admin-users-management-utils";
import type { AdminNote, AdminUserDetail, AdminUserTicketAction, AdminUsersListRow } from "./admin-users-management-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminLoadingSkeleton } from "@/components/admin/ui/admin-loading-skeleton";
import { AdminUserTicketsSection } from "./admin-user-tickets-section";

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
  ticketActionLoading: boolean;
  ticketActionFeedback: string | null;
  grantOfferingCode: string;
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
  onGrantOfferingCodeChange: (next: string) => void;
  onTicketAction: (action: AdminUserTicketAction, offeringCode: string) => Promise<void>;
  onSendManualEmail: () => Promise<void>;
  onCreateNote: () => Promise<void>;
};

export function AdminUserDetailPane(props: AdminUserDetailPaneProps) {
  return (
    <aside className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 overflow-y-auto">
      {!props.selectedParentId && (
        <p className="rounded-xl border border-dashed border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-4 text-sm text-[var(--admin-text-secondary)] text-center">
          Select a parent to view details.
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
            <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">Joined: {formatDate(props.detail.parent.createdAt)}</p>
            {props.detail.parent.suspended && <p className="mt-1 text-xs font-semibold text-rose-700">Account is temporarily locked</p>}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void props.onImpersonate(props.detail!.parent.id)}
            disabled={props.impersonateLoading}
            className="gap-1.5 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          >
            <Eye size={14} />
            {props.impersonateLoading ? "Moving..." : "View as this user"}
          </Button>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-2">
              <p className="text-[var(--admin-text-secondary)]">Notification</p>
              <p className="mt-1 text-lg font-bold text-[var(--admin-text-primary)]">{props.detail.parent.notificationCount}</p>
            </div>
            <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-2">
              <p className="text-[var(--admin-text-secondary)]">Successful transaction</p>
              <p className="mt-1 text-lg font-bold text-[var(--admin-text-primary)]">{props.selectedUser?.successfulPaymentsCount ?? 0}</p>
            </div>
          </div>

          <AdminUserTicketsSection
            entitlements={props.detail.entitlements ?? []}
            ticketActionLoading={props.ticketActionLoading}
            ticketActionFeedback={props.ticketActionFeedback}
            grantOfferingCode={props.grantOfferingCode}
            extendDays={props.extendDays}
            onGrantOfferingCodeChange={props.onGrantOfferingCodeChange}
            onExtendDaysChange={props.onExtendDaysChange}
            onTicketAction={props.onTicketAction}
          />

          {/* Email */}
          <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">Send emails manually</p>
            <Input value={props.manualEmailSubject} onChange={(e) => props.onManualEmailSubjectChange(e.target.value.slice(0, 200))} placeholder="Email subject" className="text-sm h-8" />
            <Textarea value={props.manualEmailBody} onChange={(e) => props.onManualEmailBodyChange(e.target.value.slice(0, 5000))} rows={3} placeholder="Email content..." className="text-sm" />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[var(--admin-text-secondary)]">{5000 - props.manualEmailBody.length} characters remaining</p>
              <Button size="sm" onClick={() => void props.onSendManualEmail()} disabled={props.manualEmailLoading} className="h-7 text-xs bg-teal-600 hover:bg-teal-700">
                {props.manualEmailLoading ? "Sending..." : "Send email"}
              </Button>
            </div>
            {props.manualEmailFeedback && <p className="text-xs text-[var(--admin-text-secondary)]">{props.manualEmailFeedback}</p>}
          </div>
          <SimpleListBlock title="Child profiles" empty="No child profiles yet.">
            {props.detail.children.map((child) => (
              <div key={child.id} className="mb-1.5 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-2.5 py-2 text-sm text-[var(--admin-text-secondary)]">
                {child.nickname} - {child.lessonsCompleted30d} lessons / 30 days
              </div>
            ))}
          </SimpleListBlock>

          <SimpleListBlock title="Payment history (latest 10)" empty="No transactions yet.">
            {props.detail.paymentHistory.map((payment) => (
              <div key={payment.id} className="mb-1.5 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-2.5 py-2 text-xs">
                <p className="font-semibold text-[var(--admin-text-primary)]">{toCurrency(payment.amountVnd)} {payment.currency} - {payment.status}</p>
                <p className="text-[var(--admin-text-secondary)]">{payment.provider} - {formatDate(payment.processedAt)}</p>
              </div>
            ))}
          </SimpleListBlock>

          <SimpleListBlock title="Invitation to caregiver" empty="No invitation yet.">
            {props.detail.caregiverInvites.map((invite) => (
              <div key={invite.id} className="mb-1.5 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-2.5 py-2 text-xs">
                <p className="font-semibold text-[var(--admin-text-primary)]">{invite.email}</p>
                <p className="text-[var(--admin-text-secondary)]">{invite.accepted ? "Accepted" : "Waiting"} - expires {formatDate(invite.expiresAt)}</p>
              </div>
            ))}
          </SimpleListBlock>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)] mb-2">Internal notes</p>
            <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-3 space-y-2">
              <Textarea
                value={props.noteDraft}
                onChange={(e) => props.onNoteDraftChange(e.target.value.slice(0, 500))}
                rows={3}
                maxLength={500}
                placeholder="Import internal CRM notes..."
                className="text-sm bg-[var(--admin-header-bg)]"
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--admin-text-secondary)]">{500 - props.noteDraft.length} characters remaining</p>
                <Button size="sm" onClick={() => void props.onCreateNote()} disabled={props.noteSubmitting} className="h-7 text-xs bg-teal-600 hover:bg-teal-700">
                  {props.noteSubmitting ? "Saving..." : "Add notes"}
                </Button>
              </div>
              {props.notesError && <p className="text-xs text-rose-700">{props.notesError}</p>}
            </div>
            {props.notesLoading && <p className="mt-2 text-xs text-[var(--admin-text-secondary)]">Loading notes...</p>}
            <div className="mt-2 space-y-1.5">
              {props.notes.map((note) => (
                <article key={note.id} className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-2.5 py-2 text-xs">
                  <p className="text-[var(--admin-text-secondary)]">{note.note}</p>
                  <p className="mt-1 text-[var(--admin-text-muted)]">{note.createdBy} - {formatDate(note.createdAt)}</p>
                </article>
              ))}
              {!props.notesLoading && props.notes.length === 0 && <p className="text-xs text-[var(--admin-text-secondary)]">No notes yet.</p>}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
