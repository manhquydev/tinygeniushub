"use client";

import { useState } from "react";
import { Building2, Plus, Users, Calendar, Globe, Palette } from "lucide-react";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  domain: string | null;
  isActive: boolean;
  billingStart: string | null;
  billingEnd: string | null;
  createdAt: string;
};

type CreateOrgForm = {
  name: string;
  slug: string;
  primaryColor: string;
  logoUrl: string;
  domain: string;
  billingStart: string;
  billingEnd: string;
};

const EMPTY_FORM: CreateOrgForm = {
  name: "",
  slug: "",
  primaryColor: "#0d9488",
  logoUrl: "",
  domain: "",
  billingStart: "",
  billingEnd: "",
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

export function AdminOrganizationsPanel({ initialOrgs }: { initialOrgs: Organization[] }) {
  const [orgs, setOrgs] = useState<Organization[]>(initialOrgs);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateOrgForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  function handleNameChange(name: string) {
    setForm((prev) => ({ ...prev, name, slug: slugify(name) }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          primaryColor: form.primaryColor || null,
          logoUrl: form.logoUrl || null,
          domain: form.domain || null,
          billingStart: form.billingStart || null,
          billingEnd: form.billingEnd || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Lỗi tạo tổ chức");
      }
      const json = await res.json() as { data: { org: Organization } };
      setOrgs((prev) => [json.data.org, ...prev]);
      setShowCreateForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(org: Organization) {
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !org.isActive }),
      });
      if (!res.ok) return;
      const json = await res.json() as { data: { org: Organization } };
      setOrgs((prev) => prev.map((o) => (o.id === org.id ? json.data.org : o)));
    } catch {
      // ignore
    }
  }

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);

  return (
    <div className="admin-panel-stack">
      <div className="admin-panel-header">
        <div className="admin-panel-header-left">
          <Building2 size={20} />
          <h1>Tổ chức (B2B)</h1>
          <span className="admin-badge">{orgs.length}</span>
        </div>
        <button
          className="btn-primary btn-sm"
          onClick={() => {
            setShowCreateForm(true);
            setSelectedOrgId(null);
          }}
        >
          <Plus size={14} />
          Thêm tổ chức
        </button>
      </div>

      {showCreateForm && (
        <div className="admin-card">
          <h2 className="admin-card-title">Tạo tổ chức mới</h2>
          {error && <p className="form-error">{error}</p>}
          <form onSubmit={(e) => void handleCreate(e)} className="form-stack">
            <div className="form-row-2">
              <label className="form-field">
                <span>Tên tổ chức *</span>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Trường Mầm Non Ánh Sao"
                />
              </label>
              <label className="form-field">
                <span>Slug *</span>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="truong-mam-non-anh-sao"
                />
              </label>
            </div>
            <div className="form-row-2">
              <label className="form-field">
                <span>Domain</span>
                <input
                  type="text"
                  value={form.domain}
                  onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
                  placeholder="anhsao.edu.vn"
                />
              </label>
              <label className="form-field">
                <span>Màu thương hiệu</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
                    style={{ width: 40, height: 36, padding: 2, borderRadius: 6, cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    value={form.primaryColor}
                    onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                </div>
              </label>
            </div>
            <div className="form-row-2">
              <label className="form-field">
                <span>Billing bắt đầu</span>
                <input
                  type="date"
                  value={form.billingStart}
                  onChange={(e) => setForm((p) => ({ ...p, billingStart: e.target.value }))}
                />
              </label>
              <label className="form-field">
                <span>Billing kết thúc</span>
                <input
                  type="date"
                  value={form.billingEnd}
                  onChange={(e) => setForm((p) => ({ ...p, billingEnd: e.target.value }))}
                />
              </label>
            </div>
            <label className="form-field">
              <span>Logo URL</span>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
                placeholder="https://..."
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn-primary btn-sm" disabled={creating}>
                {creating ? "Đang tạo..." : "Tạo tổ chức"}
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setError(null);
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tổ chức</th>
              <th>Domain</th>
              <th>Billing</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                  Chưa có tổ chức nào.
                </td>
              </tr>
            )}
            {orgs.map((org) => (
              <tr key={org.id} className={selectedOrgId === org.id ? "row-selected" : ""}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {org.primaryColor && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: org.primaryColor,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{org.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{org.slug}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: "#64748b" }}>{org.domain ?? "—"}</td>
                <td style={{ fontSize: 13 }}>
                  {org.billingStart ? (
                    <span>
                      {formatDate(org.billingStart)} → {formatDate(org.billingEnd)}
                    </span>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>Chưa thiết lập</span>
                  )}
                </td>
                <td>
                  <span
                    className={`admin-badge ${org.isActive ? "badge-green" : "badge-red"}`}
                  >
                    {org.isActive ? "Đang hoạt động" : "Đã vô hiệu"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn-ghost btn-xs"
                      onClick={() => setSelectedOrgId(selectedOrgId === org.id ? null : org.id)}
                    >
                      <Users size={12} />
                      Chi tiết
                    </button>
                    <button
                      className="btn-ghost btn-xs"
                      onClick={() => void handleToggleActive(org)}
                    >
                      {org.isActive ? "Vô hiệu" : "Kích hoạt"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrg && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <h2 className="admin-card-title">
            <Building2 size={16} />
            {selectedOrg.name}
          </h2>
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                <Globe size={13} /> Domain
              </span>
              <span>{selectedOrg.domain ?? "—"}</span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                <Palette size={13} /> Màu thương hiệu
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {selectedOrg.primaryColor && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: selectedOrg.primaryColor,
                    }}
                  />
                )}
                {selectedOrg.primaryColor ?? "—"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                <Calendar size={13} /> Billing
              </span>
              <span>
                {selectedOrg.billingStart
                  ? `${formatDate(selectedOrg.billingStart)} → ${formatDate(selectedOrg.billingEnd)}`
                  : "Chưa thiết lập"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Ngày tạo</span>
              <span>{formatDate(selectedOrg.createdAt)}</span>
            </div>
          </div>
          {selectedOrg.logoUrl && (
            <div style={{ marginTop: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedOrg.logoUrl} alt="Logo" style={{ height: 48, borderRadius: 6 }} />
            </div>
          )}
          <p style={{ marginTop: 16, fontSize: 13, color: "#64748b" }}>
            Để quản lý thành viên, dùng API: <code>POST /api/admin/organizations/{selectedOrg.id}/members</code>
          </p>
        </div>
      )}
    </div>
  );
}
