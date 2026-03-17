"use client";

import { useState } from "react";
import type { AbVariant } from "@/lib/ab-test-constants";
import { trackEvent } from "@/lib/analytics/track-event";

type Props = {
  courseSlug: string;
  label: string;
  priceVnd: number;
  isAuthenticated?: boolean;
  tracking?: {
    variant: AbVariant;
    bundleSlug: string;
  };
  className?: string;
};

type CheckoutResponse = {
  ok: boolean;
  data?: { checkoutUrl: string; discountApplied: boolean; finalPriceVnd: number };
  error?: { message?: string } | string;
};

function resolveCheckoutErrorMessage(response: CheckoutResponse | null, status: number) {
  if (status === 429) {
    return "Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít giây.";
  }

  if (status >= 500) {
    return "Hệ thống thanh toán đang bận. Bạn vui lòng thử lại sau.";
  }

  const message =
    typeof response?.error === "string"
      ? response.error
      : typeof response?.error?.message === "string"
        ? response.error.message
        : null;

  if (message && /(payos|webhook|gateway|provider|transaction)/i.test(message)) {
    return "Hệ thống thanh toán đang bận. Bạn vui lòng thử lại sau.";
  }

  return message ?? "Có lỗi xảy ra, vui lòng thử lại.";
}

function buildAuthEntryUrl(courseSlug: string) {
  const nextPath = `/courses/${encodeURIComponent(courseSlug)}`;
  const query = new URLSearchParams({
    next: nextPath,
    intent: "checkout",
  });

  return `/auth?${query.toString()}`;
}

export function CourseCheckoutButton({
  courseSlug,
  label,
  priceVnd,
  isAuthenticated,
  tracking,
  className,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    const authEntryUrl = buildAuthEntryUrl(courseSlug);

    if (isAuthenticated === false) {
      window.location.assign(authEntryUrl);
      return;
    }

    setLoading(true);
    setError(null);
    if (tracking) {
      trackEvent("courses_checkout_start", {
        variant: tracking.variant,
        source_page: "course_detail",
        bundle_slug: tracking.bundleSlug,
        course_slug: courseSlug,
        price_vnd: priceVnd,
      });
    }

    try {
      const res = await fetch(`/api/courses/${courseSlug}/checkout`, { method: "POST" });
      let json: CheckoutResponse | null = null;

      try {
        json = (await res.json()) as CheckoutResponse;
      } catch {
        json = null;
      }

      if (res.status === 401) {
        window.location.assign(authEntryUrl);
        return;
      }

      if (!res.ok || !json?.ok || !json.data?.checkoutUrl) {
        setError(resolveCheckoutErrorMessage(json, res.status));
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
        {loading ? "Đang xử lý..." : `${label} - ${priceVnd.toLocaleString("vi-VN")}đ`}
      </button>
      {error ? (
        <p className="error-text" style={{ fontSize: "0.85rem" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
