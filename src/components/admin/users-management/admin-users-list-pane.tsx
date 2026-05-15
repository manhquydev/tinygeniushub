"use client";

import { Search, SearchX } from "lucide-react";
import { formatDate, getSubscriptionBadgeClass, normalizeStatusLabel } from "./admin-users-management-utils";
import type { AdminUsersListRow, BulkAction, UsersSort, UsersStatusFilter } from "./admin-users-management-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminUsersListPaneProps = {
  query: string;
  statusFilter: UsersStatusFilter;
  sortBy: UsersSort;
  page: number;
  totalUsers: number;
  totalPages: number;
  users: AdminUsersListRow[];
  selectedParentId: string | null;
  selectedParentIds: string[];
  allRowsSelected: boolean;
  searchLoading: boolean;
  searchError: string | null;
  bulkAction: BulkAction;
  bulkMessage: string;
  bulkLoading: boolean;
  bulkResultMessage: string | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  onQueryChange: (next: string) => void;
  onStatusFilterChange: (next: UsersStatusFilter) => void;
  onSortByChange: (next: UsersSort) => void;
  onSelectParent: (parentId: string) => void;
  onToggleRowSelected: (parentId: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onBulkActionChange: (next: BulkAction) => void;
  onBulkMessageChange: (next: string) => void;
  onSubmitBulkAction: () => Promise<void>;
  onPrevPage: () => void;
  onNextPage: () => void;
};

const STATUS_OPTIONS: UsersStatusFilter[] = ["ALL", "TRIALING", "ACTIVE_STANDARD", "ACTIVE_FAMILYPLUS", "GRACE", "EXPIRED", "CANCELED", "REFUNDED", "NONE"];

export function AdminUsersListPane(props: AdminUsersListPaneProps) {
  return (
    <div className="space-y-3 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <p className="text-xs text-[var(--admin-text-secondary)] mb-1">Search</p>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
            <Input
              value={props.query}
              onChange={(e) => props.onQueryChange(e.target.value)}
              placeholder="Parent email or name"
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div className="w-36">
          <p className="text-xs text-[var(--admin-text-secondary)] mb-1">Status</p>
          <Select value={props.statusFilter} onValueChange={(v) => props.onStatusFilterChange(v as UsersStatusFilter)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <p className="text-xs text-[var(--admin-text-secondary)] mb-1">Arrange</p>
          <Select value={props.sortBy} onValueChange={(v) => props.onSortByChange(v as UsersSort)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt_desc" className="text-xs">Latest</SelectItem>
              <SelectItem value="createdAt_asc" className="text-xs">Oldest</SelectItem>
              <SelectItem value="plan_desc" className="text-xs">Plan gradually reduced</SelectItem>
              <SelectItem value="plan_asc" className="text-xs">Plan increases gradually</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="w-10">
                <Checkbox
                  checked={props.allRowsSelected}
                  onCheckedChange={(checked) => props.onToggleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="text-xs">Parents</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Little</TableHead>
              <TableHead className="text-xs">Pay</TableHead>
              <TableHead className="text-xs">Tham gia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.users.map((user) => {
              const selected = props.selectedParentId === user.id;
              const checked = props.selectedParentIds.includes(user.id);
              return (
                <TableRow
                  key={user.id}
                  className={cn("cursor-pointer", selected && "bg-teal-900/30 hover:bg-teal-900/30")}
                  onClick={() => props.onSelectParent(user.id)}
                >
                  <TableCell>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => { props.onToggleRowSelected(user.id, !!c); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-semibold text-[var(--admin-text-primary)]">{user.displayName ?? user.email}</p>
                    <p className="text-xs text-[var(--admin-text-secondary)]">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs border", getSubscriptionBadgeClass(user.subscription?.status))}>
                      {normalizeStatusLabel(user.subscription?.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{user.childrenCount}</TableCell>
                  <TableCell className="text-sm">{user.successfulPaymentsCount}</TableCell>
                  <TableCell className="text-xs text-[var(--admin-text-secondary)]">{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Bulk actions */}
      {props.selectedParentIds.length > 0 && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
          <p className="text-sm font-semibold text-teal-700 mb-2">Selected {props.selectedParentIds.length} users</p>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={props.bulkAction} onValueChange={(v) => props.onBulkActionChange(v as BulkAction)}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUSPEND" className="text-xs">Temporarily locked</SelectItem>
                <SelectItem value="ACTIVATE" className="text-xs">Reactivate</SelectItem>
                <SelectItem value="SEND_NOTIFICATION" className="text-xs">Send notification</SelectItem>
              </SelectContent>
            </Select>
            {props.bulkAction === "SEND_NOTIFICATION" && (
              <Input
                value={props.bulkMessage}
                onChange={(e) => props.onBulkMessageChange(e.target.value)}
                placeholder="Notification content"
                className="h-8 min-w-[200px] flex-1 text-xs"
              />
            )}
            <Button
              size="sm"
              onClick={() => void props.onSubmitBulkAction()}
              disabled={props.bulkLoading}
              className="h-8 text-xs bg-teal-600 hover:bg-teal-700"
            >
              {props.bulkLoading ? "Processing..." : "Perform"}
            </Button>
          </div>
          {props.bulkResultMessage && <p className="mt-2 text-xs text-teal-700">{props.bulkResultMessage}</p>}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-[var(--admin-text-secondary)]">
        <p>Total {props.totalUsers} users — Page {props.page}/{props.totalPages}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={props.onPrevPage} disabled={!props.canGoPrev || props.searchLoading} className="h-7 text-xs">Previous page</Button>
          <Button variant="outline" size="sm" onClick={props.onNextPage} disabled={!props.canGoNext || props.searchLoading} className="h-7 text-xs">Page sau</Button>
        </div>
      </div>

      {!props.searchLoading && props.users.length === 0 && !props.searchError && (
        <div className="rounded-xl border border-dashed border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-4 text-center text-sm text-[var(--admin-text-secondary)]">
          <SearchX size={28} className="mx-auto mb-2 text-[var(--admin-text-muted)]" />
          <p>There are no users matching the current filter.</p>
        </div>
      )}
      {props.searchError && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{props.searchError}</p>
      )}
    </div>
  );
}
