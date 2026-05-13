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
        setError(body.error?.message ?? "Unable to download discount code.");
        return;
      }

      setCoupons(body.data.coupons as CouponRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unknown error.");
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
        setError(body.error?.message ?? "Unable to create discount code.");
        return;
      }

      setCode("");
      setDiscountPercent("10");
      setMaxUses("");
      setExpiresAt("");
      setInfo("Discount code created.");
      await loadCoupons();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unknown error.");
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
        setError(body.error?.message ?? "Unable to update code status.");
        return;
      }

      setInfo("Updated discount code status.");
      await loadCoupons();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unknown error.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCopyCode(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setInfo("Copied");
      setError(null);
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Code cannot be copied.");
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]">Discount code</h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5">
          <Label htmlFor="coupon-code">Code</Label>
          <Input id="coupon-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} type="text" placeholder="WELCOME20" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="coupon-discount">Reduce (%)</Label>
          <Input id="coupon-discount" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} type="number" min={5} max={100} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="coupon-max">Maximum number of turns (optional)</Label>
          <Input id="coupon-max" value={maxUses} onChange={(event) => setMaxUses(event.target.value)} type="number" min={1} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="coupon-expires">Expiry (optional)</Label>
          <Input id="coupon-expires" type="date" min={toDateInputValue(new Date())} value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
        </div>
      </div>
      <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={() => void handleCreateCoupon()} disabled={submitting}>
        {submitting ? "Creating..." : "Code generation"}
      </Button>

      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Reduce</TableHead>
              <TableHead className="text-xs">Use / max</TableHead>
              <TableHead className="text-xs">Expired</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Act</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={`coupon-skeleton-${index}`}>
                <TableCell colSpan={6} className="text-xs text-[var(--admin-text-secondary)]">Loading...</TableCell>
              </TableRow>
            )) : null}
            {!loading ? coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="text-xs font-semibold">{coupon.code}</TableCell>
                <TableCell className="text-xs">{coupon.discountPercent}%</TableCell>
                <TableCell className="text-xs">{coupon.usedCount} / {coupon.maxUses ?? "Unlimited"}</TableCell>
                <TableCell className="text-xs">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("vi-VN") : "Unlimited"}</TableCell>
                <TableCell className="text-xs">{coupon.active ? "On" : "Turning off"}</TableCell>
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
                      {updatingId === coupon.id ? "Updating..." : coupon.active ? "Turn off" : "Turn on"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : null}
            {!loading && coupons.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-xs text-[var(--admin-text-secondary)]">No discount code yet.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {info ? <p className="text-xs text-[var(--admin-text-secondary)]">{info}</p> : null}
    </div>
  );
}
