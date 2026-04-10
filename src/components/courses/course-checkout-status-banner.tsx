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
          title: "Đang xác nhận thanh toán",
          body: "Hệ thống đang hoàn tất bước xác nhận. Bạn có thể tải lại trang sau ít phút.",
        };
      }
      return {
        tone: "border-sky-200 bg-sky-50 text-sky-900 ring-1 ring-sky-100",
        title: "Đang xác nhận thanh toán",
        body: "Giao dịch đã được ghi nhận. Hệ thống sẽ tự mở khóa ngay khi xác nhận xong.",
      };
    case "pending":
      if (input.pollTimedOut) {
        return {
          tone: "border-amber-200 bg-amber-50 text-amber-900 ring-1 ring-amber-100",
          title: "Thanh toán chưa hoàn tất",
          body: "Bạn có thể mở lại liên kết thanh toán hoặc kiểm tra lại sau.",
        };
      }
      return {
        tone: "border-amber-200 bg-amber-50 text-amber-900 ring-1 ring-amber-100",
        title: "Thanh toán đang chờ xử lý",
        body: "Nếu bạn đã thanh toán thành công, hệ thống sẽ tự cập nhật trong ít phút.",
      };
    case "success":
      return {
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100",
        title: "Thanh toán thành công",
        body: "Khóa học đã được kích hoạt.",
      };
    case "failed":
      return {
        tone: "border-rose-200 bg-rose-50 text-rose-900 ring-1 ring-rose-100",
        title: "Thanh toán thất bại",
        body: "Giao dịch chưa thành công. Bạn vui lòng thử lại.",
      };
    case "cancelled":
      return {
        tone: "border-slate-200 bg-slate-50 text-slate-900 ring-1 ring-slate-100",
        title: "Bạn đã hủy thanh toán",
        body: "Bạn có thể quay lại khi sẵn sàng.",
      };
    case "invalid":
      return {
        tone: "border-rose-200 bg-rose-50 text-rose-900 ring-1 ring-rose-100",
        title: "Liên kết thanh toán đã hết hiệu lực",
        body: "Vui lòng quay lại khóa học và tạo lại lượt thanh toán mới.",
      };
    case "not_found":
      return {
        tone: "border-rose-200 bg-rose-50 text-rose-900 ring-1 ring-rose-100",
        title: "Không xác nhận được thanh toán",
        body: "Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ nếu bạn đã thanh toán.",
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
