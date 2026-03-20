"use client";

import { useEffect, useState } from "react";

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
    <section className="card page-stack">
      <h3>Tính năng thử nghiệm</h3>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Cập nhật lúc</th>
              <th>Người cập nhật</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`feature-flag-skeleton-${index}`}>
                    <td colSpan={6}>Đang tải...</td>
                  </tr>
                ))
              : null}
            {!loading
              ? flags.map((flag) => (
                  <tr key={flag.key}>
                    <td className="font-semibold">{flag.key}</td>
                    <td>{flag.description ?? "-"}</td>
                    <td>{flag.enabled ? "Đang bật" : "Đang tắt"}</td>
                    <td>{new Date(flag.updatedAt).toLocaleString("vi-VN")}</td>
                    <td>{flag.updatedBy ?? "-"}</td>
                    <td>
                      <button
                        type="button"
                        className={flag.enabled ? "danger-button" : "solid-button"}
                        onClick={() => void toggleFlag(flag)}
                        disabled={updatingKey === flag.key}
                      >
                        {updatingKey === flag.key ? "Đang cập nhật..." : flag.enabled ? "Tắt" : "Bật"}
                      </button>
                    </td>
                  </tr>
                ))
              : null}
            {!loading && flags.length === 0 ? (
              <tr>
                <td colSpan={6}>Chưa có feature flag.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </section>
  );
}
