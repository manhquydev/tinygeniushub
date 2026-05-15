"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  parentEmailVerificationRequired: boolean;
  parentEmailVerificationTokenTtlMinutes: number;
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
        setError(body.error?.message ?? "Failed to load security configuration.");
        return;
      }

      setSecurityPolicies(body.data.policies as SecurityRateLimitPolicyRow[]);
      const controls = body.data.controls as SecurityControls;
      setSecurityControls(controls);
      setBlockedIpCidrsRaw(controls.blockedIpCidrs.join("\n"));
      setReadinessAllowlistRaw(controls.readinessAllowlistCidrs.join("\n"));
      setInfo("Refreshed security configuration.");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error.");
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
          reason: "Update from the admin security page",
          overrides,
          controls: {
            ddosMode: securityControls.ddosMode,
            globalLimitMultiplier: securityControls.globalLimitMultiplier,
            blockedIpCidrs: parseCidrList(blockedIpCidrsRaw),
            readinessAllowlistCidrs: parseCidrList(readinessAllowlistRaw),
            parentEmailVerificationRequired: securityControls.parentEmailVerificationRequired,
            parentEmailVerificationTokenTtlMinutes: securityControls.parentEmailVerificationTokenTtlMinutes,
          },
        }),
      });

      const body = await response.json();
      if (!response.ok || !body.ok || !Array.isArray(body.data?.policies) || !body.data?.controls) {
        setError(body.error?.message ?? "Unable to save security configuration.");
        return;
      }

      setSecurityPolicies(body.data.policies as SecurityRateLimitPolicyRow[]);
      const controls = body.data.controls as SecurityControls;
      setSecurityControls(controls);
      setBlockedIpCidrsRaw(controls.blockedIpCidrs.join("\n"));
      setReadinessAllowlistRaw(controls.readinessAllowlistCidrs.join("\n"));
      setInfo("Security configuration saved.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unknown error.");
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
        setError(body.error?.message ?? "Unable to export edge policy.");
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
      setInfo("Edge policy file exported.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Unknown error.");
    } finally {
      setExportingEdgePolicy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]">System security</h2>
        <p className="text-xs text-[var(--admin-text-secondary)]">Adjust access limits by endpoint, and manage block lists and allow lists.</p>
      </div>

      <div
        id="parent-email-verification-module"
        className="space-y-3 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4"
      >
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--admin-text-primary)]">
            Parent email verification module
          </h3>
          <p className="text-xs text-[var(--admin-text-secondary)]">
            Only applies to parent accounts using the service. Readers only read website content and are not affected.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border border-[var(--admin-card-border)] px-3 py-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[var(--admin-text-primary)]">
                Required to verify email before logging in
              </p>
              <p className="text-xs text-[var(--admin-text-secondary)]">
                Turn off when email service encounters emergency problems to avoid login interruptions.
              </p>
            </div>
            <Switch
              checked={securityControls.parentEmailVerificationRequired}
              onCheckedChange={(checked) =>
                setSecurityControls((current) => ({
                  ...current,
                  parentEmailVerificationRequired: checked,
                }))
              }
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="parent-email-verify-ttl">TTL token verification (minutes)</Label>
            <Input
              id="parent-email-verify-ttl"
              type="number"
              min={5}
              max={1440}
              value={securityControls.parentEmailVerificationTokenTtlMinutes}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                if (Number.isNaN(parsed)) {
                  return;
                }
                setSecurityControls((current) => ({
                  ...current,
                  parentEmailVerificationTokenTtlMinutes: Math.min(Math.max(parsed, 5), 1440),
                }));
              }}
            />
            <p className="text-xs text-[var(--admin-text-secondary)]">
              Default 15 minutes. Can be customized through the interface instead of editing the code.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>DDoS mode</Label>
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
          <Label htmlFor="limit-multiplier">Global limiting factor</Label>
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
          <Label htmlFor="blocked-cidrs">IP/CIDR block list (per line or separated by commas)</Label>
          <Textarea id="blocked-cidrs" value={blockedIpCidrsRaw} onChange={(event) => setBlockedIpCidrsRaw(event.target.value)} rows={4} placeholder={"198.51.100.10\n203.0.113.0/24"} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="allowlist-cidrs">IP/CIDR readiness whitelist</Label>
          <Textarea id="allowlist-cidrs" value={readinessAllowlistRaw} onChange={(event) => setReadinessAllowlistRaw(event.target.value)} rows={4} placeholder={"10.0.0.0/8\n192.168.0.0/16"} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={refreshSecurityPolicies} disabled={loadingSecurityPolicies}>
          {loadingSecurityPolicies ? "Loading configuration..." : "Refresh configuration"}
        </Button>
        <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={saveSecurityPolicies} disabled={savingSecurityPolicies}>
          {savingSecurityPolicies ? "Saving..." : "Save configuration"}
        </Button>
        <Button type="button" variant="outline" onClick={exportEdgePolicy} disabled={exportingEdgePolicy}>
          {exportingEdgePolicy ? "Exporting..." : "Export edge policy JSON"}
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs">Policy</TableHead>
              <TableHead className="text-xs">Locking strategy</TableHead>
              <TableHead className="text-xs">Limit</TableHead>
              <TableHead className="text-xs">Window (ms)</TableHead>
              <TableHead className="text-xs">Default</TableHead>
              <TableHead className="text-xs">Applying</TableHead>
              <TableHead className="text-xs">Valid range</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {securityPolicies.map((policy) => (
              <TableRow key={policy.key}>
                <TableCell>
                  <p className="text-sm font-semibold text-[var(--admin-text-primary)]">{policy.label}</p>
                  <p className="text-xs text-[var(--admin-text-secondary)]">{policy.key} - {policy.description}</p>
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
              <TableRow><TableCell colSpan={7} className="text-xs text-[var(--admin-text-secondary)]">There are no access restrictions configured.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {info ? <p className="text-xs text-[var(--admin-text-secondary)]">{info}</p> : null}
    </div>
  );
}
