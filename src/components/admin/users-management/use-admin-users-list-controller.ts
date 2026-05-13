"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminUsersListResponse, AdminUsersListRow, ApiResponse, BulkAction, UsersSort, UsersStatusFilter } from "./admin-users-management-types";
import { PAGE_SIZE } from "./admin-users-management-types";

export function useAdminUsersListController() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UsersStatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<UsersSort>("createdAt_desc");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [users, setUsers] = useState<AdminUsersListRow[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [usersReloadToken, setUsersReloadToken] = useState(0);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("SUSPEND");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResultMessage, setBulkResultMessage] = useState<string | null>(null);

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedParentId) ?? null, [selectedParentId, users]);
  const allRowsSelected = users.length > 0 && users.every((u) => selectedParentIds.includes(u.id));
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  useEffect(() => setSelectedParentIds((current) => current.filter((id) => users.some((u) => u.id === id))), [users]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setSearchLoading(true); setSearchError(null);
        try {
          const params = new URLSearchParams({ sort: sortBy, page: String(page), limit: String(PAGE_SIZE) });
          const trimmed = query.trim();
          if (trimmed.length > 0) params.set("q", trimmed);
          if (statusFilter !== "ALL") params.set("status", statusFilter);
          const response = await fetch(`/api/admin/users?${params.toString()}`, { method: "GET", signal: controller.signal, cache: "no-store" });
          const body = (await response.json()) as ApiResponse<AdminUsersListResponse>;
          if (!response.ok || !body.ok) {
            setSearchError(body.error?.message ?? "Unable to load user list."); setUsers([]); setTotalUsers(0); setSelectedParentId(null); return;
          }
          const rows = body.data?.users ?? [];
          setTotalUsers(body.data?.total ?? 0); setUsers(rows);
          if (rows.length === 0) { setSelectedParentId(null); return; }
          setSelectedParentId((current) => (current && rows.some((r) => r.id === current) ? current : (rows[0]?.id ?? null)));
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
          setSearchError(e instanceof Error ? e.message : "Unknown error."); setUsers([]); setTotalUsers(0); setSelectedParentId(null);
        } finally { setSearchLoading(false); }
      })();
    }, 300);
    return () => { controller.abort(); window.clearTimeout(timeoutId); };
  }, [page, query, sortBy, statusFilter, usersReloadToken]);

  function toggleRowSelected(parentId: string, checked: boolean) {
    setSelectedParentIds((current) => (checked ? (current.includes(parentId) ? current : [...current, parentId]) : current.filter((id) => id !== parentId)));
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedParentIds(checked ? users.map((u) => u.id) : []);
  }

  async function handleBulkAction() {
    if (selectedParentIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to do this?${bulkAction} cho ${selectedParentIds.length}users?`)) return;
    setBulkLoading(true); setBulkResultMessage(null);
    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parentIds: selectedParentIds, action: bulkAction, payload: bulkAction === "SEND_NOTIFICATION" ? { message: bulkMessage.trim() || undefined } : undefined }),
      });
      const body = (await response.json()) as ApiResponse<{ succeeded?: number; failed?: number }>;
      if (!response.ok || !body.ok) { setBulkResultMessage(body.error?.message ?? "Unable to perform bulk action."); return; }
      const succeeded = body.data?.succeeded ?? 0;
      const failed = body.data?.failed ?? 0;
      setBulkResultMessage(`${succeeded}success,${failed}failure.`);
      setUsers((current) => current.map((user) => selectedParentIds.includes(user.id) ? { ...user, suspended: bulkAction === "SUSPEND" ? true : bulkAction === "ACTIVATE" ? false : user.suspended } : user));
      setUsersReloadToken((v) => v + 1);
    } catch (e) {
      setBulkResultMessage(e instanceof Error ? e.message : "Unknown error.");
    } finally { setBulkLoading(false); }
  }

  return {
    query, statusFilter, sortBy, page, totalUsers, users, searchLoading, searchError, selectedParentId, selectedParentIds,
    bulkAction, bulkMessage, bulkLoading, bulkResultMessage, selectedUser, allRowsSelected, totalPages, canGoPrev, canGoNext,
    setQuery, setStatusFilter, setSortBy, setPage, setSelectedParentId, setBulkAction, setBulkMessage,
    toggleRowSelected, toggleSelectAll, handleBulkAction, reloadUsers: () => setUsersReloadToken((v) => v + 1),
  };
}
