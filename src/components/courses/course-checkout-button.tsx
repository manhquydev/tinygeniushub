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
  error?:
    | {
        message?: string;
        details?: {
          code?: string;
        };
      }
    | string;
};

function resolveCheckoutErrorMessage(response: CheckoutResponse | null, status: number) {
  if (status === 429) {
    return "You act a bit quickly. Please try again in a few seconds.";
  }

  if (status >= 500) {
    return "The payment system is busy. Please try again later.";
  }

  const code =
    response && typeof response.error === "object" && response.error
      ? response.error.details?.code ?? null
      : null;

  if (code === "COURSE_PRICE_NOT_AVAILABLE") {
    return "This course is temporarily suspending online registration. You can watch a trial lesson or get advice right away.";
  }

  if (code === "ALREADY_ENROLLED") {
    return "Your account already owns this course.";
  }

  return "Payment cannot be completed at this time. Please try again in a few minutes.";
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
  const showPriceTag = priceVnd > 0;

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
      setError("Unable to connect, please try again.");
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
        {loading ? "Processing..." : showPriceTag ? `${label} - ${priceVnd.toLocaleString("vi-VN")}D` : label}
      </button>
      {error ? (
        <p className="error-text" style={{ fontSize: "0.85rem" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
