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

const EMAIL_FLAG_PREFIX = "EMAIL_";

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

  function renderFlagTable(input: {
    title: string;
    emptyText: string;
    rows: FeatureFlagRow[];
    loadingRows: number;
  }) {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">{input.title}</h4>
        <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
                <TableHead className="text-xs">Key</TableHead>
                <TableHead className="text-xs">Mô tả</TableHead>
                <TableHead className="text-xs">Trạng thái</TableHead>
                <TableHead className="text-xs">Cập nhật lúc</TableHead>
                <TableHead className="text-xs">Người cập nhật</TableHead>
                <TableHead className="text-xs">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: input.loadingRows }).map((_, index) => (
                    <TableRow key={`${input.title}-skeleton-${index}`}>
                      <TableCell colSpan={6} className="text-xs text-[var(--admin-text-secondary)]">Đang tải...</TableCell>
                    </TableRow>
                  ))
                : null}
              {!loading
                ? input.rows.map((flag) => (
                    <TableRow key={flag.key}>
                      <TableCell className="text-xs font-semibold text-[var(--admin-text-primary)]">{flag.key}</TableCell>
                      <TableCell className="text-xs text-[var(--admin-text-secondary)]">{flag.description ?? "-"}</TableCell>
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
                  ))
                : null}
              {!loading && input.rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-xs text-[var(--admin-text-secondary)]">{input.emptyText}</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const emailFlags = flags.filter((flag) => flag.key.startsWith(EMAIL_FLAG_PREFIX));
  const otherFlags = flags.filter((flag) => !flag.key.startsWith(EMAIL_FLAG_PREFIX));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]">Feature Flags</h3>

      {renderFlagTable({
        title: "Điều khiển email hệ thống",
        emptyText: "Chưa có email flag.",
        rows: emailFlags,
        loadingRows: 5,
      })}

      {renderFlagTable({
        title: "Tính năng thử nghiệm khác",
        emptyText: "Chưa có feature flag ngoài email.",
        rows: otherFlags,
        loadingRows: 3,
      })}

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {info ? <p className="text-xs text-[var(--admin-text-secondary)]">{info}</p> : null}
    </div>
  );
}
