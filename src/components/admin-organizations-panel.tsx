"use client";

import { useState } from "react";
import { Building2, Plus, Users, Globe, Palette, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 60);
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
      const json = await res.json() as { data?: { org: Organization }; error?: { message?: string } };
      if (!res.ok || !json.data?.org) throw new Error(json.error?.message ?? "Cập nhật thất bại");
      setOrgs((prev) => prev.map((o) => (o.id === org.id ? json.data!.org : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    }
  }

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-slate-600" />
          <h1 className="text-sm font-bold uppercase tracking-wide text-slate-600">Tổ chức (B2B)</h1>
          <Badge variant="secondary">{orgs.length}</Badge>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1 bg-teal-600 hover:bg-teal-700" onClick={() => { setShowCreateForm(true); setSelectedOrgId(null); }}>
          <Plus size={13} />
          Thêm tổ chức
        </Button>
      </div>

      {showCreateForm && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Tạo tổ chức mới</h2>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="org-name">Tên tổ chức *</Label>
                <Input id="org-name" type="text" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Trường Mầm Non Ánh Sao" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="org-slug">Slug *</Label>
                <Input id="org-slug" type="text" required value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="truong-mam-non-anh-sao" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="org-domain">Domain</Label>
                <Input id="org-domain" type="text" value={form.domain} onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))} placeholder="anhsao.edu.vn" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="org-color">Màu thương hiệu</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.primaryColor} onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))} className="h-9 w-10 rounded border border-slate-200 p-0.5 cursor-pointer" />
                  <Input id="org-color" type="text" value={form.primaryColor} onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="org-billing-start">Billing bắt đầu</Label>
                <Input id="org-billing-start" type="date" value={form.billingStart} onChange={(e) => setForm((p) => ({ ...p, billingStart: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="org-billing-end">Billing kết thúc</Label>
                <Input id="org-billing-end" type="date" value={form.billingEnd} onChange={(e) => setForm((p) => ({ ...p, billingEnd: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="org-logo">Logo URL</Label>
              <Input id="org-logo" type="url" value={form.logoUrl} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={creating} className="bg-teal-600 hover:bg-teal-700">
                {creating ? "Đang tạo..." : "Tạo tổ chức"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); setError(null); }}>Hủy</Button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs">Tổ chức</TableHead>
              <TableHead className="text-xs">Domain</TableHead>
              <TableHead className="text-xs">Billing</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-slate-500 py-8">Chưa có tổ chức nào.</TableCell>
              </TableRow>
            )}
            {orgs.map((org) => (
              <TableRow key={org.id} className={cn(selectedOrgId === org.id && "bg-teal-50/40 hover:bg-teal-50/40")}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {org.primaryColor && <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: org.primaryColor }} />}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{org.name}</p>
                      <p className="text-xs text-slate-500">{org.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{org.domain ?? "—"}</TableCell>
                <TableCell className="text-xs">
                  {org.billingStart ? <span>{formatDate(org.billingStart)} → {formatDate(org.billingEnd)}</span> : <span className="text-slate-400">Chưa thiết lập</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs border", org.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}>
                    {org.isActive ? "Đang hoạt động" : "Đã vô hiệu"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setSelectedOrgId(selectedOrgId === org.id ? null : org.id)}>
                      <Users size={11} /> Chi tiết
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void handleToggleActive(org)}>
                      {org.isActive ? "Vô hiệu" : "Kích hoạt"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedOrg && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-700">{selectedOrg.name}</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Globe size={13} />
              <span className="font-medium">Domain:</span>
              <span>{selectedOrg.domain ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Palette size={13} />
              <span className="font-medium">Màu:</span>
              {selectedOrg.primaryColor && <span className="inline-block h-3 w-3 rounded" style={{ background: selectedOrg.primaryColor }} />}
              <span>{selectedOrg.primaryColor ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar size={13} />
              <span className="font-medium">Billing:</span>
              <span>{selectedOrg.billingStart ? `${formatDate(selectedOrg.billingStart)} → ${formatDate(selectedOrg.billingEnd)}` : "Chưa thiết lập"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">Ngày tạo:</span>
              <span>{formatDate(selectedOrg.createdAt)}</span>
            </div>
          </div>
          {selectedOrg.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedOrg.logoUrl} alt="Logo" className="h-12 rounded" />
          )}
          <p className="text-xs text-slate-500">
            Để quản lý thành viên, dùng API: <code>POST /api/admin/organizations/{selectedOrg.id}/members</code>
          </p>
        </div>
      )}
    </div>
  );
}
