"use client";

import { useState } from "react";

type SecurityRateLimitPolicyRow = {
  key: string;
  label: string;
  description: string;
  keyStrategy: string;
  defaultLimit: number;
  defaultWindowMs: number;
  minLimit: number;
  maxLimit: number;
  minWindowMs: number;
  maxWindowMs: number;
  currentLimit: number;
  currentWindowMs: number;
  effectiveLimit: number;
  effectiveWindowMs: number;
};

type SecurityControls = {
  ddosMode: "normal" | "elevated" | "emergency";
  globalLimitMultiplier: number;
  blockedIpCidrs: string[];
  readinessAllowlistCidrs: string[];
};

interface AdminSecurityPanelProps {
  initialSecurityPolicies: SecurityRateLimitPolicyRow[];
  initialSecurityControls: SecurityControls;
}

function formatWindowMs(windowMs: number) {
  if (windowMs % (1000 * 60 * 60) === 0) {
    return `${windowMs / (1000 * 60 * 60)}h`;
  }

  if (windowMs % (1000 * 60) === 0) {
    return `${windowMs / (1000 * 60)}m`;
  }

  if (windowMs % 1000 === 0) {
    return `${windowMs / 1000}s`;
  }

  return `${windowMs}ms`;
}

function parseCidrList(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
}

export function AdminSecurityPanel({ initialSecurityPolicies, initialSecurityControls }: AdminSecurityPanelProps) {
  const [securityPolicies, setSecurityPolicies] = useState(initialSecurityPolicies);
  const [securityControls, setSecurityControls] = useState(initialSecurityControls);
  const [blockedIpCidrsRaw, setBlockedIpCidrsRaw] = useState(initialSecurityControls.blockedIpCidrs.join("\n"));
  const [readinessAllowlistRaw, setReadinessAllowlistRaw] = useState(
    initialSecurityControls.readinessAllowlistCidrs.join("\n"),
  );
  const [loadingSecurityPolicies, setLoadingSecurityPolicies] = useState(false);
  const [savingSecurityPolicies, setSavingSecurityPolicies] = useState(false);
  const [exportingEdgePolicy, setExportingEdgePolicy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function updateSecurityPolicyValue(input: {
    key: string;
    field: "currentLimit" | "currentWindowMs";
    value: string;
  }) {
    const parsed = Number.parseInt(input.value, 10);
    if (Number.isNaN(parsed)) {
      return;
    }

    setSecurityPolicies((current) =>
      current.map((policy) => {
        if (policy.key !== input.key) {
          return policy;
        }

        if (input.field === "currentLimit") {
          return {
            ...policy,
            currentLimit: Math.min(Math.max(parsed, policy.minLimit), policy.maxLimit),
          };
        }

        return {
          ...policy,
          currentWindowMs: Math.min(Math.max(parsed, policy.minWindowMs), policy.maxWindowMs),
        };
      }),
    );
  }

  async function refreshSecurityPolicies() {
    setLoadingSecurityPolicies(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/admin/security/rate-limits");
      const body = await response.json();
      if (!response.ok || !body.ok || !Array.isArray(body.data?.policies) || !body.data?.controls) {
        setError(body.error?.message ?? "Không tải được cấu hình bảo mật.");
        return;
      }

      setSecurityPolicies(body.data.policies as SecurityRateLimitPolicyRow[]);
      const controls = body.data.controls as SecurityControls;
      setSecurityControls(controls);
      setBlockedIpCidrsRaw(controls.blockedIpCidrs.join("\n"));
      setReadinessAllowlistRaw(controls.readinessAllowlistCidrs.join("\n"));
      setInfo("Đã làm mới cấu hình bảo mật.");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Lỗi không xác định.");
    } finally {
      setLoadingSecurityPolicies(false);
    }
  }

  async function saveSecurityPolicies() {
    setSavingSecurityPolicies(true);
    setError(null);
    setInfo(null);

    try {
      const overrides = Object.fromEntries(
        securityPolicies.map((policy) => [
          policy.key,
          {
            limit: policy.currentLimit,
            windowMs: policy.currentWindowMs,
          },
        ]),
      );

      const response = await fetch("/api/admin/security/rate-limits", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reason: "Cập nhật từ trang bảo mật quản trị",
          overrides,
          controls: {
            ddosMode: securityControls.ddosMode,
            globalLimitMultiplier: securityControls.globalLimitMultiplier,
            blockedIpCidrs: parseCidrList(blockedIpCidrsRaw),
            readinessAllowlistCidrs: parseCidrList(readinessAllowlistRaw),
          },
        }),
      });

      const body = await response.json();
      if (!response.ok || !body.ok || !Array.isArray(body.data?.policies) || !body.data?.controls) {
        setError(body.error?.message ?? "Không lưu được cấu hình bảo mật.");
        return;
      }

      setSecurityPolicies(body.data.policies as SecurityRateLimitPolicyRow[]);
      const controls = body.data.controls as SecurityControls;
      setSecurityControls(controls);
      setBlockedIpCidrsRaw(controls.blockedIpCidrs.join("\n"));
      setReadinessAllowlistRaw(controls.readinessAllowlistCidrs.join("\n"));
      setInfo("Đã lưu cấu hình bảo mật.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Lỗi không xác định.");
    } finally {
      setSavingSecurityPolicies(false);
    }
  }

  async function exportEdgePolicy() {
    setExportingEdgePolicy(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/admin/security/edge-export");
      const body = await response.json();
      if (!response.ok || !body.ok || !body.data?.edgePolicy) {
        setError(body.error?.message ?? "Không xuất được edge policy.");
        return;
      }

      const filename = `edge-policy-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      const json = JSON.stringify(body.data.edgePolicy, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      setInfo("Đã xuất tệp edge policy.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Lỗi không xác định.");
    } finally {
      setExportingEdgePolicy(false);
    }
  }

  return (
    <section className="card page-stack">
      <h2>Bảo mật hệ thống</h2>
      <p className="muted-text">
        Điều chỉnh giới hạn truy cập theo endpoint, đồng thời quản lý danh sách chặn và danh sách cho phép.
      </p>

      <div className="admin-controls">
        <label>
          Chế độ DDoS
          <select
            value={securityControls.ddosMode}
            onChange={(event) =>
              setSecurityControls((current) => ({
                ...current,
                ddosMode: event.target.value as SecurityControls["ddosMode"],
              }))
            }
          >
            <option value="normal">normal</option>
            <option value="elevated">elevated</option>
            <option value="emergency">emergency</option>
          </select>
        </label>
        <label>
          Hệ số giới hạn toàn cục
          <input
            type="number"
            step="0.05"
            min={0.2}
            max={1}
            value={securityControls.globalLimitMultiplier}
            onChange={(event) =>
              setSecurityControls((current) => ({
                ...current,
                globalLimitMultiplier: Math.min(Math.max(Number(event.target.value) || 0.2, 0.2), 1),
              }))
            }
          />
        </label>
      </div>

      <div className="admin-controls">
        <label className="stack-field">
          Danh sách chặn IP/CIDR (mỗi dòng hoặc phân tách bởi dấu phẩy)
          <textarea
            value={blockedIpCidrsRaw}
            onChange={(event) => setBlockedIpCidrsRaw(event.target.value)}
            rows={4}
            placeholder={"198.51.100.10\n203.0.113.0/24"}
          />
        </label>
        <label className="stack-field">
          Danh sách cho phép readiness IP/CIDR
          <textarea
            value={readinessAllowlistRaw}
            onChange={(event) => setReadinessAllowlistRaw(event.target.value)}
            rows={4}
            placeholder={"10.0.0.0/8\n192.168.0.0/16"}
          />
        </label>
      </div>

      <div className="admin-controls">
        <button type="button" className="ghost-button" onClick={refreshSecurityPolicies} disabled={loadingSecurityPolicies}>
          {loadingSecurityPolicies ? "Đang tải cấu hình..." : "Làm mới cấu hình"}
        </button>
        <button type="button" className="solid-button" onClick={saveSecurityPolicies} disabled={savingSecurityPolicies}>
          {savingSecurityPolicies ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
        <button type="button" className="ghost-button" onClick={exportEdgePolicy} disabled={exportingEdgePolicy}>
          {exportingEdgePolicy ? "Đang xuất..." : "Xuất edge policy JSON"}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Chính sách</th>
              <th>Chiến lược khóa</th>
              <th>Giới hạn</th>
              <th>Cửa sổ (ms)</th>
              <th>Mặc định</th>
              <th>Đang áp dụng</th>
              <th>Khoảng hợp lệ</th>
            </tr>
          </thead>
          <tbody>
            {securityPolicies.map((policy) => (
              <tr key={policy.key}>
                <td>
                  <strong>{policy.label}</strong>
                  <p className="muted-text">
                    {policy.key} - {policy.description}
                  </p>
                </td>
                <td>{policy.keyStrategy}</td>
                <td>
                  <input
                    type="number"
                    value={policy.currentLimit}
                    min={policy.minLimit}
                    max={policy.maxLimit}
                    onChange={(event) =>
                      updateSecurityPolicyValue({
                        key: policy.key,
                        field: "currentLimit",
                        value: event.target.value,
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={policy.currentWindowMs}
                    min={policy.minWindowMs}
                    max={policy.maxWindowMs}
                    onChange={(event) =>
                      updateSecurityPolicyValue({
                        key: policy.key,
                        field: "currentWindowMs",
                        value: event.target.value,
                      })
                    }
                  />
                </td>
                <td>
                  {policy.defaultLimit} / {formatWindowMs(policy.defaultWindowMs)}
                </td>
                <td>
                  {policy.effectiveLimit} / {formatWindowMs(policy.effectiveWindowMs)}
                </td>
                <td>
                  limit {policy.minLimit}-{policy.maxLimit}
                  <br />
                  window {formatWindowMs(policy.minWindowMs)}-{formatWindowMs(policy.maxWindowMs)}
                </td>
              </tr>
            ))}
            {securityPolicies.length === 0 ? (
              <tr>
                <td colSpan={7}>Chưa có cấu hình giới hạn truy cập.</td>
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
