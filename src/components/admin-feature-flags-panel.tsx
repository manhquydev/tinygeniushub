"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FeatureFlagRow = {
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

export function AdminFeatureFlagsPanel() {
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function loadFlags() {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "GET",
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok || !body.ok || !Array.isArray(body.data?.featureFlags)) {
        setError(body.error?.message ?? "Không tải được danh sách feature flags.");
        return;
      }

      setFlags(body.data.featureFlags as FeatureFlagRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFlags();
  }, []);

  async function toggleFlag(flag: FeatureFlagRow) {
    const nextEnabled = !flag.enabled;
    const confirmMessage = `Bạn có chắc muốn ${nextEnabled ? "bật" : "tắt"} feature flag ${flag.key}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setUpdatingKey(flag.key);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/admin/feature-flags/${encodeURIComponent(flag.key)}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          enabled: nextEnabled,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok || !body.data?.featureFlag) {
        setError(body.error?.message ?? "Không cập nhật được feature flag.");
        return;
      }

      setInfo(`Đã ${nextEnabled ? "bật" : "tắt"} ${flag.key}.`);
      await loadFlags();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Lỗi không xác định.");
    } finally {
      setUpdatingKey(null);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Tính năng thử nghiệm</h3>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs">Key</TableHead>
              <TableHead className="text-xs">Mô tả</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs">Cập nhật lúc</TableHead>
              <TableHead className="text-xs">Người cập nhật</TableHead>
              <TableHead className="text-xs">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 4 }).map((_, index) => (
              <TableRow key={`feature-flag-skeleton-${index}`}>
                <TableCell colSpan={6} className="text-xs text-slate-500">Đang tải...</TableCell>
              </TableRow>
            )) : null}
            {!loading ? flags.map((flag) => (
              <TableRow key={flag.key}>
                <TableCell className="text-xs font-semibold text-slate-800">{flag.key}</TableCell>
                <TableCell className="text-xs text-slate-600">{flag.description ?? "-"}</TableCell>
                <TableCell className="text-xs">{flag.enabled ? "Đang bật" : "Đang tắt"}</TableCell>
                <TableCell className="text-xs">{new Date(flag.updatedAt).toLocaleString("vi-VN")}</TableCell>
                <TableCell className="text-xs">{flag.updatedBy ?? "-"}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="sm"
                    variant={flag.enabled ? "destructive" : "default"}
                    className={flag.enabled ? undefined : "bg-teal-600 hover:bg-teal-700 h-7 text-xs"}
                    onClick={() => void toggleFlag(flag)}
                    disabled={updatingKey === flag.key}
                  >
                    {updatingKey === flag.key ? "Đang cập nhật..." : flag.enabled ? "Tắt" : "Bật"}
                  </Button>
                </TableCell>
              </TableRow>
            )) : null}
            {!loading && flags.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-xs text-slate-500">Chưa có feature flag.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {info ? <p className="text-xs text-slate-500">{info}</p> : null}
    </div>
  );
}
