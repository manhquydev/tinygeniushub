"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

type PlanCode = "MONTHLY_STANDARD" | "YEARLY_STANDARD" | "YEARLY_FAMILY_PLUS";

// Plan amounts in VND for analytics (mirrors plan-config.ts)
const PLAN_AMOUNT_VND: Record<PlanCode, number> = {
  MONTHLY_STANDARD: 99_000,
  YEARLY_STANDARD: 799_000,
  YEARLY_FAMILY_PLUS: 1_199_000,
};

type CheckoutPlanButtonProps = {
  planCode: PlanCode;
  label: string;
  className?: string;
};

export function CheckoutPlanButton({ planCode, label, className }: CheckoutPlanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          planCode,
          successPath: "/parent/dashboard",
          cancelPath: "/pricing",
        }),
      });

      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể tạo checkout session");
        return;
      }

      const checkoutUrl = body.data?.checkout?.checkoutUrl;
      if (typeof checkoutUrl !== "string" || checkoutUrl.length === 0) {
        setError("Checkout URL không hợp lệ");
        return;
      }

      trackEvent("purchase", {
        value: PLAN_AMOUNT_VND[planCode],
        currency: "VND",
      });
      window.location.assign(checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <button type="button" onClick={startCheckout} disabled={loading} className={className ?? "solid-button"}>
        {loading ? "Đang tạo checkout..." : label}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
