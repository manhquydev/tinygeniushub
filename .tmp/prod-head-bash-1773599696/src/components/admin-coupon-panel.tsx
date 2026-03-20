"use client";

import { useEffect, useState } from "react";

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
    <section className="card page-stack">
      <h3>Mã giảm giá</h3>

      <div className="admin-controls">
        <label>
          Mã
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            type="text"
            placeholder="WELCOME20"
          />
        </label>
        <label>
          Giảm (%)
          <input
            value={discountPercent}
            onChange={(event) => setDiscountPercent(event.target.value)}
            type="number"
            min={5}
            max={100}
          />
        </label>
        <label>
          Số lượt tối đa (tùy chọn)
          <input value={maxUses} onChange={(event) => setMaxUses(event.target.value)} type="number" min={1} />
        </label>
        <label>
          Hết hạn (tùy chọn)
          <input
            type="date"
            min={toDateInputValue(new Date())}
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </label>
        <button type="button" className="solid-button" onClick={() => void handleCreateCoupon()} disabled={submitting}>
          {submitting ? "Đang tạo..." : "Tạo mã"}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Giảm</th>
              <th>Dùng / tối đa</th>
              <th>Hết hạn</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`coupon-skeleton-${index}`}>
                    <td colSpan={6}>Đang tải...</td>
                  </tr>
                ))
              : null}
            {!loading
              ? coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="font-semibold">{coupon.code}</td>
                    <td>{coupon.discountPercent}%</td>
                    <td>
                      {coupon.usedCount} / {coupon.maxUses ?? "Không giới hạn"}
                    </td>
                    <td>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("vi-VN") : "Không giới hạn"}</td>
                    <td>{coupon.active ? "Đang bật" : "Đang tắt"}</td>
                    <td className="space-x-2">
                      <button type="button" className="ghost-button" onClick={() => void handleCopyCode(coupon.code)}>
                        Copy
                      </button>
                      <button
                        type="button"
                        className={coupon.active ? "danger-button" : "solid-button"}
                        onClick={() => void handleToggleCoupon(coupon.id)}
                        disabled={updatingId === coupon.id}
                      >
                        {updatingId === coupon.id ? "Đang cập nhật..." : coupon.active ? "Tắt" : "Bật"}
                      </button>
                    </td>
                  </tr>
                ))
              : null}
            {!loading && coupons.length === 0 ? (
              <tr>
                <td colSpan={6}>Chưa có mã giảm giá.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </section>
  );
}
