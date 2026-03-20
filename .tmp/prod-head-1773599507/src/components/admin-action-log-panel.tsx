"use client";

import { useCallback, useEffect, useState } from "react";

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
    <section className="card page-stack">
      <h2>Nhật ký quản trị</h2>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
              <th className="px-2 py-2">Thời gian</th>
              <th className="px-2 py-2">Người thực hiện</th>
              <th className="px-2 py-2">Thao tác</th>
              <th className="px-2 py-2">Đối tượng</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`admin-log-skeleton-${index}`} className="border-t border-slate-100">
                    <td className="px-2 py-2">
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-2 py-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-2 py-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-2 py-2">
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    </td>
                  </tr>
                ))
              : null}

            {!loading
              ? logs.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-slate-700">{new Date(entry.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.adminEmail}</td>
                    <td className="px-2 py-2 font-semibold text-slate-800">{entry.action}</td>
                    <td className="px-2 py-2 text-slate-600">{entry.target ?? "-"}</td>
                  </tr>
                ))
              : null}

            {!loading && logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-3 text-slate-500">
                  Chưa có nhật ký nào.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
