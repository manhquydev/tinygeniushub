"use client";

import { useState } from "react";
import { Gift, Plus } from "lucide-react";

export type GiftCode = {
  id: string;
  code: string;
  planCode: string;
  durationDays: number;
  usedAt: string | null;
  usedByParentId: string | null;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
};

type GenerateForm = {
  count: number;
  planCode: string;
  durationDays: number;
  expiresAt: string;
};

function defaultExpiresAt() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

const EMPTY_FORM: GenerateForm = {
  count: 10,
  planCode: "YEARLY_STANDARD",
  durationDays: 365,
  expiresAt: defaultExpiresAt(),
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function getStatus(code: GiftCode): { label: string; cls: string } {
  if (code.usedAt) return { label: "Đã dùng", cls: "" };
  if (new Date(code.expiresAt) < new Date()) return { label: "Hết hạn", cls: "badge-red" };
  return { label: "Còn hạn", cls: "badge-green" };
}

function GenerateFormPanel({
  onGenerated,
  onCancel,
}: {
  onGenerated: (codes: GiftCode[]) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<GenerateForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gift-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Lỗi tạo mã");
      }
      const json = (await res.json()) as { data: { codes: GiftCode[] } };
      onGenerated(json.data.codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-card">
      <h2 className="admin-card-title">Tạo mã quà tặng</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={(e) => void handleSubmit(e)} className="form-stack">
        <div className="form-row-2">
          <label className="form-field">
            <span>Số lượng (1–100)</span>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={form.count}
              onChange={(e) => setForm((p) => ({ ...p, count: Number(e.target.value) }))}
            />
          </label>
          <label className="form-field">
            <span>Gói</span>
            <select
              value={form.planCode}
              onChange={(e) => setForm((p) => ({ ...p, planCode: e.target.value }))}
            >
              <option value="YEARLY_STANDARD">YEARLY_STANDARD</option>
              <option value="MONTHLY_STANDARD">MONTHLY_STANDARD</option>
            </select>
          </label>
        </div>
        <div className="form-row-2">
          <label className="form-field">
            <span>Thời hạn (ngày)</span>
            <input
              type="number"
              min={1}
              required
              value={form.durationDays}
              onChange={(e) => setForm((p) => ({ ...p, durationDays: Number(e.target.value) }))}
            />
          </label>
          <label className="form-field">
            <span>Hết hạn lúc</span>
            <input
              type="date"
              required
              value={form.expiresAt}
              onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary btn-sm" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo mã"}
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export function AdminGiftCodePanel({ initialCodes }: { initialCodes: GiftCode[] }) {
  const [codes, setCodes] = useState<GiftCode[]>(initialCodes);
  const [showForm, setShowForm] = useState(false);

  function handleGenerated(newCodes: GiftCode[]) {
    setCodes((prev) => [...newCodes, ...prev]);
    setShowForm(false);
  }

  return (
    <div className="admin-panel-stack">
      <div className="admin-panel-header">
        <div className="admin-panel-header-left">
          <Gift size={20} />
          <h1>Gift Codes</h1>
          <span className="admin-badge">{codes.length}</span>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          Tạo mã
        </button>
      </div>

      {showForm && (
        <GenerateFormPanel onGenerated={handleGenerated} onCancel={() => setShowForm(false)} />
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Plan</th>
              <th>Duration</th>
              <th>Expires</th>
              <th>Trạng thái</th>
              <th>Created by</th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                  Chưa có mã nào.
                </td>
              </tr>
            )}
            {codes.map((c) => {
              const status = getStatus(c);
              return (
                <tr key={c.id}>
                  <td>
                    <code style={{ fontSize: 13 }}>{c.code}</code>
                  </td>
                  <td style={{ fontSize: 13 }}>{c.planCode}</td>
                  <td style={{ fontSize: 13 }}>{c.durationDays}d</td>
                  <td style={{ fontSize: 13 }}>{formatDate(c.expiresAt)}</td>
                  <td>
                    <span className={`admin-badge ${status.cls}`}>{status.label}</span>
                  </td>
                  <td style={{ fontSize: 13, color: "#64748b" }}>{c.createdBy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
