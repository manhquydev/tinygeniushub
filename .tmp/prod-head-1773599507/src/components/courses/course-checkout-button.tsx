"use client";

import { useState } from "react";

type Props = {
  courseSlug: string;
  label: string;
  priceVnd: number;
  className?: string;
};

export function CourseCheckoutButton({ courseSlug, label, priceVnd, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseSlug}/checkout`, { method: "POST" });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { checkoutUrl: string; discountApplied: boolean; finalPriceVnd: number };
        error?: string;
      };
      if (!json.ok || !json.data?.checkoutUrl) {
        setError(json.error ?? "Có lỗi xảy ra, vui lòng thử lại.");
        return;
      }
      window.location.href = json.data.checkoutUrl;
    } catch {
      setError("Không thể kết nối, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.4rem" }}>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={className ?? "solid-button"}
        style={{ width: "fit-content", opacity: loading ? 0.7 : 1 }}
      >
        {loading
          ? "Đang xử lý..."
          : `${label} — ${priceVnd.toLocaleString("vi-VN")}đ`}
      </button>
      {error && (
        <p className="error-text" style={{ fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
