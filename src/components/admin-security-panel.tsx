"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Bảo mật hệ thống</h2>
        <p className="text-xs text-slate-500">Điều chỉnh giới hạn truy cập theo endpoint, đồng thời quản lý danh sách chặn và danh sách cho phép.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Chế độ DDoS</Label>
          <Select
            value={securityControls.ddosMode}
            onValueChange={(value) => setSecurityControls((current) => ({ ...current, ddosMode: value as SecurityControls["ddosMode"] }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">normal</SelectItem>
              <SelectItem value="elevated">elevated</SelectItem>
              <SelectItem value="emergency">emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="limit-multiplier">Hệ số giới hạn toàn cục</Label>
          <Input
            id="limit-multiplier"
            type="number"
            step="0.05"
            min={0.2}
            max={1}
            value={securityControls.globalLimitMultiplier}
            onChange={(event) => setSecurityControls((current) => ({ ...current, globalLimitMultiplier: Math.min(Math.max(Number(event.target.value) || 0.2, 0.2), 1) }))}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="blocked-cidrs">Danh sách chặn IP/CIDR (mỗi dòng hoặc phân tách bởi dấu phẩy)</Label>
          <Textarea id="blocked-cidrs" value={blockedIpCidrsRaw} onChange={(event) => setBlockedIpCidrsRaw(event.target.value)} rows={4} placeholder={"198.51.100.10\n203.0.113.0/24"} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="allowlist-cidrs">Danh sách cho phép readiness IP/CIDR</Label>
          <Textarea id="allowlist-cidrs" value={readinessAllowlistRaw} onChange={(event) => setReadinessAllowlistRaw(event.target.value)} rows={4} placeholder={"10.0.0.0/8\n192.168.0.0/16"} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={refreshSecurityPolicies} disabled={loadingSecurityPolicies}>
          {loadingSecurityPolicies ? "Đang tải cấu hình..." : "Làm mới cấu hình"}
        </Button>
        <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={saveSecurityPolicies} disabled={savingSecurityPolicies}>
          {savingSecurityPolicies ? "Đang lưu..." : "Lưu cấu hình"}
        </Button>
        <Button type="button" variant="outline" onClick={exportEdgePolicy} disabled={exportingEdgePolicy}>
          {exportingEdgePolicy ? "Đang xuất..." : "Xuất edge policy JSON"}
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs">Chính sách</TableHead>
              <TableHead className="text-xs">Chiến lược khóa</TableHead>
              <TableHead className="text-xs">Giới hạn</TableHead>
              <TableHead className="text-xs">Cửa sổ (ms)</TableHead>
              <TableHead className="text-xs">Mặc định</TableHead>
              <TableHead className="text-xs">Đang áp dụng</TableHead>
              <TableHead className="text-xs">Khoảng hợp lệ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {securityPolicies.map((policy) => (
              <TableRow key={policy.key}>
                <TableCell>
                  <p className="text-sm font-semibold text-slate-800">{policy.label}</p>
                  <p className="text-xs text-slate-500">{policy.key} - {policy.description}</p>
                </TableCell>
                <TableCell className="text-xs">{policy.keyStrategy}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={policy.currentLimit}
                    min={policy.minLimit}
                    max={policy.maxLimit}
                    className="h-7 w-20 text-xs"
                    onChange={(event) => updateSecurityPolicyValue({ key: policy.key, field: "currentLimit", value: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={policy.currentWindowMs}
                    min={policy.minWindowMs}
                    max={policy.maxWindowMs}
                    className="h-7 w-24 text-xs"
                    onChange={(event) => updateSecurityPolicyValue({ key: policy.key, field: "currentWindowMs", value: event.target.value })}
                  />
                </TableCell>
                <TableCell className="text-xs">{policy.defaultLimit} / {formatWindowMs(policy.defaultWindowMs)}</TableCell>
                <TableCell className="text-xs">{policy.effectiveLimit} / {formatWindowMs(policy.effectiveWindowMs)}</TableCell>
                <TableCell className="text-xs">
                  limit {policy.minLimit}-{policy.maxLimit}<br />
                  window {formatWindowMs(policy.minWindowMs)}-{formatWindowMs(policy.maxWindowMs)}
                </TableCell>
              </TableRow>
            ))}
            {securityPolicies.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-xs text-slate-500">Chưa có cấu hình giới hạn truy cập.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {info ? <p className="text-xs text-slate-500">{info}</p> : null}
    </div>
  );
}
