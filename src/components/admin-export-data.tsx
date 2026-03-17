"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRangeValidation(from: string, to: string) {
  if (!from || !to) {
    return {
      valid: false,
      message: "Vui lòng chọn đủ ngày bắt đầu và kết thúc.",
    };
  }

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return {
      valid: false,
      message: "Khoảng ngày không hợp lệ.",
    };
  }

  if (fromDate >= toDate) {
    return {
      valid: false,
      message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc.",
    };
  }

  const rangeDays = (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000);
  if (rangeDays > 90) {
    return {
      valid: false,
      message: "Khoảng ngày tối đa là 90 ngày.",
    };
  }

  return {
    valid: true,
    message: "Khoảng ngày hợp lệ.",
  };
}

export function AdminExportData() {
  const [from, setFrom] = useState(() => toDateInputValue(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));

  const validation = useMemo(() => getRangeValidation(from, to), [from, to]);
  const paymentsHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    params.set("status", "ALL");
    return `/api/admin/export/payments?${params.toString()}`;
  }, [from, to]);

  async function logAction(action: string, detail: Record<string, unknown>) {
    try {
      await fetch("/api/admin/log", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action,
          target: "admin.export",
          detail,
        }),
        keepalive: true,
      });
    } catch {
      // Export should continue even if logging fails.
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Xuất dữ liệu</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="export-from">Từ ngày</Label>
          <Input id="export-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="export-to">Đến ngày</Label>
          <Input id="export-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        <div className="flex items-end">
          <p className={`text-sm ${validation.valid ? "text-emerald-600" : "text-rose-600"}`}>{validation.message}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={paymentsHref}
          download
          aria-disabled={!validation.valid}
          onClick={(event) => {
            if (!validation.valid) { event.preventDefault(); return; }
            void logAction("EXPORT_CSV", { type: "payments", from, to });
          }}
          className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
            validation.valid ? "bg-teal-600 text-white hover:-translate-y-0.5" : "cursor-not-allowed bg-slate-200 text-slate-500"
          }`}
        >
          Xuất CSV thanh toán
        </a>

        <a
          href="/api/admin/export/users"
          download
          aria-disabled={!validation.valid}
          onClick={(event) => {
            if (!validation.valid) { event.preventDefault(); return; }
            void logAction("EXPORT_CSV", { type: "users" });
          }}
          className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition ${
            validation.valid ? "border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5" : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          }`}
        >
          Xuất CSV người dùng
        </a>
      </div>
    </div>
  );
}
