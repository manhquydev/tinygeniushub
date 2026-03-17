"use client";

import { useCallback, useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ApiResponse<TData> = {
  ok: boolean;
  data?: TData;
  error?: {
    message?: string;
  };
};

type AdminLogEntry = {
  id: string;
  adminEmail: string;
  action: string;
  target: string | null;
  createdAt: string;
};

export function AdminActionLogPanel() {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/log?limit=50", {
        method: "GET",
        cache: "no-store",
      });

      const body = (await response.json()) as ApiResponse<{ logs?: AdminLogEntry[] }>;
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không tải được nhật ký quản trị.");
        return;
      }

      setLogs(body.data?.logs ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
    const intervalId = window.setInterval(() => {
      void fetchLogs();
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchLogs]);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Nhật ký quản trị</h2>

      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs">Thời gian</TableHead>
              <TableHead className="text-xs">Người thực hiện</TableHead>
              <TableHead className="text-xs">Thao tác</TableHead>
              <TableHead className="text-xs">Đối tượng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 4 }).map((_, index) => (
              <TableRow key={`admin-log-skeleton-${index}`}>
                <TableCell><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /></TableCell>
                <TableCell><div className="h-4 w-40 animate-pulse rounded bg-slate-200" /></TableCell>
                <TableCell><div className="h-4 w-24 animate-pulse rounded bg-slate-200" /></TableCell>
                <TableCell><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /></TableCell>
              </TableRow>
            )) : null}
            {!loading ? logs.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-xs text-slate-600">{new Date(entry.createdAt).toLocaleString("vi-VN")}</TableCell>
                <TableCell className="text-xs text-slate-600">{entry.adminEmail}</TableCell>
                <TableCell className="text-xs font-semibold text-slate-800">{entry.action}</TableCell>
                <TableCell className="text-xs text-slate-500">{entry.target ?? "-"}</TableCell>
              </TableRow>
            )) : null}
            {!loading && logs.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-xs text-slate-500">Chưa có nhật ký nào.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
