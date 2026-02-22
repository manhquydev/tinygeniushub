"use client";

import { useState } from "react";

type PaymentRow = {
  id: string;
  provider: string;
  providerTransactionId: string;
  amountVnd: number;
  currency: string;
  status: string;
  processedAt: string;
  parent: {
    email: string;
  };
};

type WebhookRow = {
  id: string;
  provider: string;
  eventId: string;
  signatureValid: boolean;
  status: string;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
};

type LessonTrialRow = {
  id: string;
  slug: string;
  title: string;
  trialEnabled: boolean;
  trackCode: string;
};

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

interface AdminOperationsPanelProps {
  initialPayments: PaymentRow[];
  initialWebhooks: WebhookRow[];
  lessonTrialRows: LessonTrialRow[];
  initialSecurityPolicies: SecurityRateLimitPolicyRow[];
  initialSecurityControls: SecurityControls;
}

const paymentStatuses = ["ALL", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
const webhookStatuses = ["ALL", "RECEIVED", "PROCESSED", "IGNORED", "FAILED"] as const;
const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function normalizeLimit(limitRaw: string) {
  const parsed = Number.parseInt(limitRaw, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.min(Math.max(parsed, MIN_LIMIT), MAX_LIMIT);
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

export function AdminOperationsPanel({
  initialPayments,
  initialWebhooks,
  lessonTrialRows,
  initialSecurityPolicies,
  initialSecurityControls,
}: AdminOperationsPanelProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [lessons, setLessons] = useState(lessonTrialRows);
  const [securityPolicies, setSecurityPolicies] = useState(initialSecurityPolicies);
  const [securityControls, setSecurityControls] = useState(initialSecurityControls);
  const [blockedIpCidrsRaw, setBlockedIpCidrsRaw] = useState(initialSecurityControls.blockedIpCidrs.join("\n"));
  const [readinessAllowlistRaw, setReadinessAllowlistRaw] = useState(
    initialSecurityControls.readinessAllowlistCidrs.join("\n"),
  );
  const [paymentStatus, setPaymentStatus] = useState<(typeof paymentStatuses)[number]>("ALL");
  const [webhookStatus, setWebhookStatus] = useState<(typeof webhookStatuses)[number]>("ALL");
  const [limit, setLimit] = useState(String(DEFAULT_LIMIT));
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [updatingLessonId, setUpdatingLessonId] = useState<string | null>(null);
  const [loadingSecurityPolicies, setLoadingSecurityPolicies] = useState(false);
  const [savingSecurityPolicies, setSavingSecurityPolicies] = useState(false);
  const [exportingEdgePolicy, setExportingEdgePolicy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function refreshPayments() {
    setLoadingPayments(true);
    setError(null);
    setInfo(null);

    try {
      const limitValue = normalizeLimit(limit);
      if (limitValue === null) {
        setError(`Limit phai la so nguyen trong khoang ${MIN_LIMIT}-${MAX_LIMIT}.`);
        return;
      }

      const params = new URLSearchParams();
      params.set("limit", String(limitValue));
      if (paymentStatus !== "ALL") {
        params.set("status", paymentStatus);
      }

      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      const body = await response.json();

      if (!response.ok || !body.ok || !Array.isArray(body.data?.payments)) {
        setError(body.error?.message ?? "Khong tai duoc payments.");
        return;
      }

      setPayments(body.data.payments as PaymentRow[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Loi khong xac dinh.");
    } finally {
      setLoadingPayments(false);
    }
  }

  async function refreshWebhooks() {
    setLoadingWebhooks(true);
    setError(null);
    setInfo(null);

    try {
      const limitValue = normalizeLimit(limit);
      if (limitValue === null) {
        setError(`Limit phai la so nguyen trong khoang ${MIN_LIMIT}-${MAX_LIMIT}.`);
        return;
      }

      const params = new URLSearchParams();
      params.set("limit", String(limitValue));
      if (webhookStatus !== "ALL") {
        params.set("status", webhookStatus);
      }

      const response = await fetch(`/api/admin/webhooks?${params.toString()}`);
      const body = await response.json();

      if (!response.ok || !body.ok || !Array.isArray(body.data?.webhooks)) {
        setError(body.error?.message ?? "Khong tai duoc webhooks.");
        return;
      }

      setWebhooks(body.data.webhooks as WebhookRow[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Loi khong xac dinh.");
    } finally {
      setLoadingWebhooks(false);
    }
  }

  async function toggleTrialFlag(lessonId: string, trialEnabled: boolean) {
    setUpdatingLessonId(lessonId);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}/trial-flag`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          trialEnabled: !trialEnabled,
        }),
      });

      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Khong cap nhat duoc trial flag.");
        return;
      }

      setLessons((current) =>
        current.map((lesson) => (lesson.id === lessonId ? { ...lesson, trialEnabled: !trialEnabled } : lesson)),
      );
      setInfo("Da cap nhat trial flag cho lesson.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Loi khong xac dinh.");
    } finally {
      setUpdatingLessonId(null);
    }
  }

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
        setError(body.error?.message ?? "Khong tai duoc security policy.");
        return;
      }

      setSecurityPolicies(body.data.policies as SecurityRateLimitPolicyRow[]);
      const controls = body.data.controls as SecurityControls;
      setSecurityControls(controls);
      setBlockedIpCidrsRaw(controls.blockedIpCidrs.join("\n"));
      setReadinessAllowlistRaw(controls.readinessAllowlistCidrs.join("\n"));
      setInfo("Da refresh security policy.");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Loi khong xac dinh.");
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
          reason: "Updated from admin operations panel",
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
        setError(body.error?.message ?? "Khong luu duoc security policy.");
        return;
      }

      setSecurityPolicies(body.data.policies as SecurityRateLimitPolicyRow[]);
      const controls = body.data.controls as SecurityControls;
      setSecurityControls(controls);
      setBlockedIpCidrsRaw(controls.blockedIpCidrs.join("\n"));
      setReadinessAllowlistRaw(controls.readinessAllowlistCidrs.join("\n"));
      setInfo("Da luu security policy.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Loi khong xac dinh.");
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
        setError(body.error?.message ?? "Khong export duoc edge policy.");
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
      setInfo("Da export edge policy JSON.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Loi khong xac dinh.");
    } finally {
      setExportingEdgePolicy(false);
    }
  }

  return (
    <section className="card page-stack">
      <h2>Admin Operations</h2>
      <p className="muted-text">Panel nay su dung truc tiep cac API admin de kiem tra billing/webhook va trial gating.</p>

      <div className="admin-controls">
        <label>
          Limit
          <input
            value={limit}
            type="number"
            min={MIN_LIMIT}
            max={MAX_LIMIT}
            onChange={(event) => setLimit(event.target.value)}
            placeholder={String(DEFAULT_LIMIT)}
          />
        </label>
        <label>
          Payment status
          <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as typeof paymentStatus)}>
            {paymentStatuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghost-button" onClick={refreshPayments} disabled={loadingPayments}>
          {loadingPayments ? "Dang tai payments..." : "Refresh payments"}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Parent</th>
              <th>Provider</th>
              <th>Txn</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Processed</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.parent.email}</td>
                <td>{payment.provider}</td>
                <td>{payment.providerTransactionId}</td>
                <td>
                  {payment.amountVnd.toLocaleString("vi-VN")} {payment.currency}
                </td>
                <td>{payment.status}</td>
                <td>{new Date(payment.processedAt).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6}>Khong co payment records.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="admin-controls">
        <label>
          Webhook status
          <select value={webhookStatus} onChange={(event) => setWebhookStatus(event.target.value as typeof webhookStatus)}>
            {webhookStatuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghost-button" onClick={refreshWebhooks} disabled={loadingWebhooks}>
          {loadingWebhooks ? "Dang tai webhooks..." : "Refresh webhooks"}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Event</th>
              <th>Status</th>
              <th>Signature</th>
              <th>Error</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((event) => (
              <tr key={event.id}>
                <td>{event.provider}</td>
                <td>{event.eventId}</td>
                <td>{event.status}</td>
                <td>{event.signatureValid ? "valid" : "invalid"}</td>
                <td>{event.errorMessage ?? "-"}</td>
                <td>{new Date(event.createdAt).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
            {webhooks.length === 0 ? (
              <tr>
                <td colSpan={6}>Khong co webhook records.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="page-stack">
        <h3>Lesson Trial Flag</h3>
        <div className="admin-lesson-list">
          {lessons.map((lesson) => (
            <article key={lesson.id} className="list-item">
              <div>
                <strong>{lesson.title}</strong>
                <p className="muted-text">
                  {lesson.slug} - {lesson.trackCode} - trial={lesson.trialEnabled ? "ON" : "OFF"}
                </p>
              </div>
              <button
                type="button"
                className={lesson.trialEnabled ? "danger-button" : "solid-button"}
                onClick={() => toggleTrialFlag(lesson.id, lesson.trialEnabled)}
                disabled={updatingLessonId === lesson.id}
              >
                {updatingLessonId === lesson.id ? "Dang cap nhat..." : lesson.trialEnabled ? "Tat trial" : "Bat trial"}
              </button>
            </article>
          ))}
          {lessons.length === 0 ? <p className="muted-text">Khong co lesson nao.</p> : null}
        </div>
      </div>

      <div className="page-stack">
        <h3>Security / DDoS Policies</h3>
        <p className="muted-text">
          Dieu chinh rate-limit theo endpoint. Thay doi nay duoc ap dung o app-layer va can dong bo voi WAF/edge rule.
        </p>
        <div className="admin-controls">
          <label>
            DDoS mode
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
            Global limit multiplier
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
            Blocked IP/CIDR (newline/comma)
            <textarea
              value={blockedIpCidrsRaw}
              onChange={(event) => setBlockedIpCidrsRaw(event.target.value)}
              rows={4}
              placeholder={"198.51.100.10\n203.0.113.0/24"}
            />
          </label>
          <label className="stack-field">
            Readiness allowlist IP/CIDR
            <textarea
              value={readinessAllowlistRaw}
              onChange={(event) => setReadinessAllowlistRaw(event.target.value)}
              rows={4}
              placeholder={"10.0.0.0/8\n192.168.0.0/16"}
            />
          </label>
        </div>
        <div className="admin-controls">
          <button
            type="button"
            className="ghost-button"
            onClick={refreshSecurityPolicies}
            disabled={loadingSecurityPolicies}
          >
            {loadingSecurityPolicies ? "Dang tai security policy..." : "Refresh security policy"}
          </button>
          <button
            type="button"
            className="solid-button"
            onClick={saveSecurityPolicies}
            disabled={savingSecurityPolicies}
          >
            {savingSecurityPolicies ? "Dang luu..." : "Save security policy"}
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={exportEdgePolicy}
            disabled={exportingEdgePolicy}
          >
            {exportingEdgePolicy ? "Dang export..." : "Export edge policy JSON"}
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Strategy</th>
                <th>Limit</th>
                <th>Window ms</th>
                <th>Default</th>
                <th>Runtime</th>
                <th>Range</th>
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
                  <td colSpan={7}>Khong co security policy.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </section>
  );
}
