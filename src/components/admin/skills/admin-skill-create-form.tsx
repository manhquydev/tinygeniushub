"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateForm = {
  code: string;
  domain: string;
  nameVi: string;
  nameEn: string;
  gradeLevel: number;
  orderNo: number;
};

const EMPTY_FORM: CreateForm = {
  code: "",
  domain: "MATH",
  nameVi: "",
  nameEn: "",
  gradeLevel: 1,
  orderNo: 0,
};

type Props = {
  onCreated: () => void;
  onCancel: () => void;
};

export function AdminSkillCreateForm({ onCreated, onCancel }: Props) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.toUpperCase().replace(/\s/g, "_"),
          domain: form.domain,
          nameVi: form.nameVi,
          nameEn: form.nameEn || undefined,
          gradeLevel: form.gradeLevel,
          orderNo: form.orderNo,
        }),
      });
      const json = await res.json() as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Tạo skill thất bại");
      setForm(EMPTY_FORM);
      onCreated();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-4 space-y-3">
      <h2 className="text-sm font-semibold text-[var(--admin-text-secondary)]">Tạo skill mới</h2>
      {createError && <p className="text-xs text-rose-600">{createError}</p>}
      <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="sk-code">Code (VD: ADDITION_BASIC) *</Label>
            <Input id="sk-code" required value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="ADDITION_BASIC" />
          </div>
          <div className="grid gap-1.5">
            <Label>Domain *</Label>
            <Select value={form.domain} onValueChange={(v) => setForm((p) => ({ ...p, domain: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MATH">Toán học</SelectItem>
                <SelectItem value="ENGLISH_PHONICS">Phonics Tiếng Anh</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="sk-name-vi">Tên Tiếng Việt *</Label>
            <Input id="sk-name-vi" required value={form.nameVi} onChange={(e) => setForm((p) => ({ ...p, nameVi: e.target.value }))} placeholder="Phép cộng cơ bản" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sk-name-en">Tên Tiếng Anh</Label>
            <Input id="sk-name-en" value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder="Basic Addition" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="sk-grade">Lớp (1–12) *</Label>
            <Input id="sk-grade" type="number" min={1} max={12} required value={form.gradeLevel} onChange={(e) => setForm((p) => ({ ...p, gradeLevel: Number(e.target.value) }))} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sk-order">Thứ tự</Label>
            <Input id="sk-order" type="number" min={0} value={form.orderNo} onChange={(e) => setForm((p) => ({ ...p, orderNo: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={creating} className="bg-teal-600 hover:bg-teal-700">
            {creating ? "Đang tạo..." : "Tạo skill"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
        </div>
      </form>
    </div>
  );
}
