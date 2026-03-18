"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CouponRow = {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
};

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AdminCouponPanel() {
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function loadCoupons() {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "GET",
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok || !body.ok || !Array.isArray(body.data?.coupons)) {
        setError(body.error?.message ?? "Không tải được mã giảm giá.");
        return;
      }

      setCoupons(body.data.coupons as CouponRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCoupons();
  }, []);

  async function handleCreateCoupon() {
    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountPercent: Number(discountPercent),
          maxUses: maxUses.trim().length > 0 ? Number(maxUses) : null,
          expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.000Z`).toISOString() : null,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok || !body.data?.coupon) {
        setError(body.error?.message ?? "Không tạo được mã giảm giá.");
        return;
      }

      setCode("");
      setDiscountPercent("10");
      setMaxUses("");
      setExpiresAt("");
      setInfo("Đã tạo mã giảm giá.");
      await loadCoupons();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Lỗi không xác định.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleCoupon(couponId: string) {
    setUpdatingId(couponId);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/admin/coupons/${encodeURIComponent(couponId)}`, {
        method: "PATCH",
      });
      const body = await response.json();
      if (!response.ok || !body.ok || !body.data?.coupon) {
        setError(body.error?.message ?? "Không cập nhật được trạng thái mã.");
        return;
      }

      setInfo("Đã cập nhật trạng thái mã giảm giá.");
      await loadCoupons();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Lỗi không xác định.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCopyCode(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setInfo("Đã sao chép");
      setError(null);
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Không sao chép được mã.");
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]">Mã giảm giá</h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5">
          <Label htmlFor="coupon-code">Mã</Label>
          <Input id="coupon-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} type="text" placeholder="WELCOME20" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="coupon-discount">Giảm (%)</Label>
          <Input id="coupon-discount" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} type="number" min={5} max={100} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="coupon-max">Số lượt tối đa (tùy chọn)</Label>
          <Input id="coupon-max" value={maxUses} onChange={(event) => setMaxUses(event.target.value)} type="number" min={1} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="coupon-expires">Hết hạn (tùy chọn)</Label>
          <Input id="coupon-expires" type="date" min={toDateInputValue(new Date())} value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
        </div>
      </div>
      <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={() => void handleCreateCoupon()} disabled={submitting}>
        {submitting ? "Đang tạo..." : "Tạo mã"}
      </Button>

      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs">Mã</TableHead>
              <TableHead className="text-xs">Giảm</TableHead>
              <TableHead className="text-xs">Dùng / tối đa</TableHead>
              <TableHead className="text-xs">Hết hạn</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={`coupon-skeleton-${index}`}>
                <TableCell colSpan={6} className="text-xs text-[var(--admin-text-secondary)]">Đang tải...</TableCell>
              </TableRow>
            )) : null}
            {!loading ? coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="text-xs font-semibold">{coupon.code}</TableCell>
                <TableCell className="text-xs">{coupon.discountPercent}%</TableCell>
                <TableCell className="text-xs">{coupon.usedCount} / {coupon.maxUses ?? "Không giới hạn"}</TableCell>
                <TableCell className="text-xs">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("vi-VN") : "Không giới hạn"}</TableCell>
                <TableCell className="text-xs">{coupon.active ? "Đang bật" : "Đang tắt"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => void handleCopyCode(coupon.code)}>Copy</Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-xs"
                      variant={coupon.active ? "destructive" : "default"}
                      onClick={() => void handleToggleCoupon(coupon.id)}
                      disabled={updatingId === coupon.id}
                    >
                      {updatingId === coupon.id ? "Đang cập nhật..." : coupon.active ? "Tắt" : "Bật"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : null}
            {!loading && coupons.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-xs text-[var(--admin-text-secondary)]">Chưa có mã giảm giá.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {info ? <p className="text-xs text-[var(--admin-text-secondary)]">{info}</p> : null}
    </div>
  );
}
