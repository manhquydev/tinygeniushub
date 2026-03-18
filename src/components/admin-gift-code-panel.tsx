"use client";

import { useState } from "react";
import { Gift, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

function getStatus(code: GiftCode): { label: string; variant: "default" | "destructive" | "secondary" | "outline" } {
  if (code.usedAt) return { label: "Đã dùng", variant: "secondary" };
  if (new Date(code.expiresAt) < new Date()) return { label: "Hết hạn", variant: "destructive" };
  return { label: "Còn hạn", variant: "default" };
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
      const json = (await res.json()) as { data?: { codes: GiftCode[] }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Lỗi tạo mã");
      onGenerated(json.data!.codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-4 space-y-3">
      <h2 className="text-sm font-semibold text-[var(--admin-text-secondary)]">Tạo mã quà tặng</h2>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="gc-count">Số lượng (1–100)</Label>
            <Input id="gc-count" type="number" min={1} max={100} required value={form.count} onChange={(e) => setForm((p) => ({ ...p, count: Number(e.target.value) }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Gói</Label>
            <Select value={form.planCode} onValueChange={(value) => setForm((p) => ({ ...p, planCode: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="YEARLY_STANDARD">YEARLY_STANDARD</SelectItem>
                <SelectItem value="MONTHLY_STANDARD">MONTHLY_STANDARD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="gc-duration">Thời hạn (ngày)</Label>
            <Input id="gc-duration" type="number" min={1} required value={form.durationDays} onChange={(e) => setForm((p) => ({ ...p, durationDays: Number(e.target.value) }))} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="gc-expires">Hết hạn lúc</Label>
            <Input id="gc-expires" type="date" required value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
            {loading ? "Đang tạo..." : "Tạo mã"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-[var(--admin-text-secondary)]" />
          <h1 className="text-sm font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]">Gift Codes</h1>
          <Badge variant="secondary">{codes.length}</Badge>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1 bg-teal-600 hover:bg-teal-700" onClick={() => setShowForm(true)}>
          <Plus size={13} />
          Tạo mã
        </Button>
      </div>

      {showForm && <GenerateFormPanel onGenerated={handleGenerated} onCancel={() => setShowForm(false)} />}

      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Plan</TableHead>
              <TableHead className="text-xs">Duration</TableHead>
              <TableHead className="text-xs">Expires</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs">Created by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-xs text-center text-[var(--admin-text-secondary)] py-8">Chưa có mã nào.</TableCell>
              </TableRow>
            )}
            {codes.map((c) => {
              const status = getStatus(c);
              return (
                <TableRow key={c.id}>
                  <TableCell><code className="text-xs">{c.code}</code></TableCell>
                  <TableCell className="text-xs">{c.planCode}</TableCell>
                  <TableCell className="text-xs">{c.durationDays}d</TableCell>
                  <TableCell className="text-xs">{formatDate(c.expiresAt)}</TableCell>
                  <TableCell><Badge variant={status.variant} className="text-xs">{status.label}</Badge></TableCell>
                  <TableCell className="text-xs text-[var(--admin-text-secondary)]">{c.createdBy}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
