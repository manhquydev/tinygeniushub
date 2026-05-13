"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type CheckoutQueryStatus =
  | "processing"
  | "pending"
  | "failed"
  | "cancelled"
  | "invalid"
  | "not_found"
  | "error"
  | "success";

type PollStatus = "pending" | "succeeded" | "failed" | "not_found";

type CheckoutStatusResponse = {
  ok?: boolean;
  data?: {
    status?: PollStatus;
    redirectTo?: string;
  };
  error?: {
    message?: string;
  };
};

function readQueryStatus(value: string | null): CheckoutQueryStatus | null {
  if (!value) return null;
  if (
    value === "processing" ||
    value === "pending" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "invalid" ||
    value === "not_found" ||
    value === "error" ||
    value === "success"
  ) {
    return value;
  }
  return null;
}

function resolveBannerCopy(input: {
  queryStatus: CheckoutQueryStatus;
  pollStatus: PollStatus | null;
  pollTimedOut: boolean;
}) {
  const effectiveStatus =
    input.pollStatus === "failed" || input.pollStatus === "not_found"
      ? input.pollStatus
      : input.queryStatus;

  switch (effectiveStatus) {
    case "processing":
      if (input.pollTimedOut) {
        return {
          tone: "border-sky-200 bg-sky-50 text-sky-900 ring-1 ring-sky-100",
          title: "Confirming payment",
          body: "The system is completing the confirmation step. You can reload the page after a few minutes.",
        };
      }
      return {
        tone: "border-sky-200 bg-sky-50 text-sky-900 ring-1 ring-sky-100",
        title: "Confirming payment",
        body: "The transaction has been recorded. The system will automatically unlock as soon as confirmation is complete.",
      };
    case "pending":
      if (input.pollTimedOut) {
        return {
          tone: "border-amber-200 bg-amber-50 text-amber-900 ring-1 ring-amber-100",
          title: "Payment has not been completed",
          body: "You can reopen the payment link or check back later.",
        };
      }
      return {
        tone: "border-amber-200 bg-amber-50 text-amber-900 ring-1 ring-amber-100",
        title: "Payment is pending",
        body: "If you have successfully paid, the system will update itself in a few minutes.",
      };
    case "success":
      return {
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100",
        title: "Payment successful",
        body: "The course has been activated.",
      };
    case "failed":
    case "cancelled":
    case "invalid":
    case "not_found":
    case "error":
      return {
        tone: "border-slate-200 bg-slate-50 text-slate-900 ring-1 ring-slate-100",
        title: "Payment cannot be confirmed",
        body: "Please try again in a few minutes. If money has been deducted, please contact support.",
      };
    default:
      return null;
  }
}

export function CourseCheckoutStatusBanner() {
  const searchParams = useSearchParams();
  const queryStatus = readQueryStatus(searchParams.get("checkout"));
  const orderCode = searchParams.get("orderCode");
  const [pollStatus, setPollStatus] = useState<PollStatus | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  const shouldPoll =
    Boolean(orderCode) && (queryStatus === "processing" || queryStatus === "pending");

  useEffect(() => {
    if (!shouldPoll || !orderCode) {
      setPollStatus(null);
      setPollTimedOut(false);
      return;
    }

    let isStopped = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const maxAttempts = 30;
    const pollIntervalMs = 2500;

    const run = async () => {
      if (isStopped) return;
      attempt += 1;

      try {
        const response = await fetch(
          `/api/courses/checkout/status?orderCode=${encodeURIComponent(orderCode)}`,
          { cache: "no-store" },
        );
        const body = (await response.json().catch(() => null)) as CheckoutStatusResponse | null;

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setPollTimedOut(true);
            return;
          }

          throw new Error("poll_failed");
        }

        const status = body?.ok ? body.data?.status : null;

        if (status === "succeeded") {
          const redirectTo =
            typeof body?.data?.redirectTo === "string" && body.data.redirectTo.length > 0
              ? body.data.redirectTo
              : "/parent/courses?checkout=success";
          window.location.assign(redirectTo);
          return;
        }

        if (status === "failed" || status === "not_found") {
          setPollStatus(status);
          return;
        }

        setPollStatus(status === "pending" ? "pending" : null);
      } catch {
        // Ignore temporary poll failures; next cycle may recover.
      }

      if (attempt >= maxAttempts) {
        setPollTimedOut(true);
        return;
      }

      timer = setTimeout(run, pollIntervalMs);
    };

    void run();

    return () => {
      isStopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [orderCode, shouldPoll]);

  const banner = useMemo(() => {
    if (!queryStatus) return null;
    return resolveBannerCopy({
      queryStatus,
      pollStatus,
      pollTimedOut,
    });
  }, [pollStatus, pollTimedOut, queryStatus]);

  if (!queryStatus || !banner) {
    return null;
  }

  return (
    <section className={`rounded-2xl border px-4 py-3 text-sm sm:px-5 ${banner.tone}`}>
      <p className="font-extrabold">{banner.title}</p>
      <p className="mt-1 leading-relaxed">{banner.body}</p>
    </section>
  );
}
