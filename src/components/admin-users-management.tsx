"use client";

import { useRouter } from "next/navigation";
import { AdminUserDetailPane } from "./admin/users-management/admin-user-detail-pane";
import { AdminUsersListPane } from "./admin/users-management/admin-users-list-pane";
import { useAdminUserDetailController } from "./admin/users-management/use-admin-user-detail-controller";
import { useAdminUsersListController } from "./admin/users-management/use-admin-users-list-controller";

export function AdminUsersManagement() {
  const router = useRouter();
  const listVm = useAdminUsersListController();
  const detailVm = useAdminUserDetailController({
    selectedParentId: listVm.selectedParentId,
    router,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <AdminUsersListPane
          query={listVm.query}
          statusFilter={listVm.statusFilter}
          sortBy={listVm.sortBy}
          page={listVm.page}
          totalUsers={listVm.totalUsers}
          totalPages={listVm.totalPages}
          users={listVm.users}
          selectedParentId={listVm.selectedParentId}
          selectedParentIds={listVm.selectedParentIds}
          allRowsSelected={listVm.allRowsSelected}
          searchLoading={listVm.searchLoading}
          searchError={listVm.searchError}
          bulkAction={listVm.bulkAction}
          bulkMessage={listVm.bulkMessage}
          bulkLoading={listVm.bulkLoading}
          bulkResultMessage={listVm.bulkResultMessage}
          canGoPrev={listVm.canGoPrev}
          canGoNext={listVm.canGoNext}
          onQueryChange={listVm.setQuery}
          onStatusFilterChange={listVm.setStatusFilter}
          onSortByChange={listVm.setSortBy}
          onSelectParent={listVm.setSelectedParentId}
          onToggleRowSelected={listVm.toggleRowSelected}
          onToggleSelectAll={listVm.toggleSelectAll}
          onBulkActionChange={listVm.setBulkAction}
          onBulkMessageChange={listVm.setBulkMessage}
          onSubmitBulkAction={listVm.handleBulkAction}
          onPrevPage={() => listVm.setPage((current) => Math.max(1, current - 1))}
          onNextPage={() => listVm.setPage((current) => Math.min(listVm.totalPages, current + 1))}
        />

        <AdminUserDetailPane
          selectedParentId={listVm.selectedParentId}
          selectedUser={listVm.selectedUser}
          detail={detailVm.detail}
          detailLoading={detailVm.detailLoading}
          detailError={detailVm.detailError}
          impersonateLoading={detailVm.impersonateLoading}
          subscriptionActionLoading={detailVm.subscriptionActionLoading}
          subscriptionActionFeedback={detailVm.subscriptionActionFeedback}
          extendDays={detailVm.extendDays}
          manualEmailSubject={detailVm.manualEmailSubject}
          manualEmailBody={detailVm.manualEmailBody}
          manualEmailLoading={detailVm.manualEmailLoading}
          manualEmailFeedback={detailVm.manualEmailFeedback}
          notes={detailVm.notes}
          notesLoading={detailVm.notesLoading}
          notesError={detailVm.notesError}
          noteDraft={detailVm.noteDraft}
          noteSubmitting={detailVm.noteSubmitting}
          onExtendDaysChange={detailVm.setExtendDays}
          onManualEmailSubjectChange={detailVm.setManualEmailSubject}
          onManualEmailBodyChange={detailVm.setManualEmailBody}
          onNoteDraftChange={detailVm.setNoteDraft}
          onImpersonate={detailVm.handleImpersonate}
          onSubscriptionAction={detailVm.handleSubscriptionAction}
          onSendManualEmail={detailVm.handleSendManualEmail}
          onCreateNote={detailVm.handleCreateNote}
        />
      </div>
    </div>
  );
}
