import Link from "next/link";
import { ChevronRight, CircleCheckBig, ShieldCheck } from "lucide-react";
import { CourseCheckoutButton } from "@/components/courses/course-checkout-button";
import type { AbVariant } from "@/lib/ab-test-constants";
import type { CourseDisplayPricing } from "@/modules/courses/course-pricing";
import { COURSE_TRIAL_PREVIEW_LESSON_LIMIT } from "@/modules/courses/course-trial-constants";

type Props = {
  courseSlug: string;
  pricing: Pick<
    CourseDisplayPricing,
    "salePriceVnd" | "listPriceVnd" | "hasDiscount" | "isPurchasable" | "saleEndsAt" | "statusLabel"
  >;
  isOwned: boolean;
  isAuthenticated: boolean;
  childEntryHref: string;
  variant: AbVariant;
  checkoutLabel: string;
};

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function formatSaleEndAt(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function CourseDetailSidebar({
  courseSlug,
  pricing,
  isOwned,
  isAuthenticated,
  childEntryHref,
  variant,
  checkoutLabel,
}: Props) {
  const currentPriceVnd = Math.max(0, pricing.salePriceVnd);
  const showDiscount = pricing.listPriceVnd > currentPriceVnd && pricing.hasDiscount;
  const isFreeSale = pricing.statusLabel === "freeTemporary" && pricing.isPurchasable && currentPriceVnd === 0;
  const isPendingPricing = pricing.statusLabel === "pending";
  const saleEndsAtLabel = formatSaleEndAt(pricing.saleEndsAt ?? null);
  const trialAnchorHref = "#curriculum-preview";
  const checkoutCtaLabel = isFreeSale ? "Nhận khóa 0đ ngay" : checkoutLabel;

  return (
    <div className="sticky top-6 space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Giá khóa học</p>
        <div className="mt-1 flex items-end gap-2">
          <p className="text-3xl font-black tracking-[-0.02em] text-emerald-700">{formatCurrency(currentPriceVnd)}</p>
          {showDiscount ? (
            <p className="pb-1 text-sm text-slate-500 line-through">{formatCurrency(pricing.listPriceVnd)}</p>
          ) : null}
        </div>
        {showDiscount ? (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
            {isFreeSale ? "Ưu đãi 100% tạm thời" : "Đang giảm so với giá gốc"}
          </p>
        ) : null}
        {showDiscount && saleEndsAtLabel ? (
          <p className="mt-1 text-xs text-emerald-700/80">Kết thúc ưu đãi: {saleEndsAtLabel}</p>
        ) : null}
        <p className="mt-1 text-xs text-emerald-700/80">
          {pricing.isPurchasable
            ? isFreeSale
              ? "Nhận khóa ngay với giá 0đ. Hệ thống kích hoạt trực tiếp, không qua PayOS."
              : "Thanh toán một lần, mở khóa ngay sau khi xác nhận."
            : isPendingPricing
              ? `Khóa này đang tạm khóa thanh toán online. Trong lúc chờ, phụ huynh có thể xem thử ${COURSE_TRIAL_PREVIEW_LESSON_LIMIT} bài đầu.`
              : `Phụ huynh vẫn có thể xem thử ${COURSE_TRIAL_PREVIEW_LESSON_LIMIT} bài đầu trước khi chốt lộ trình.`}
        </p>
      </div>

      {isOwned ? (
        <div className="grid gap-3 rounded-2xl border border-emerald-200 bg-white p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CircleCheckBig className="h-4 w-4" />
            Bạn đã sở hữu khóa học này.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={childEntryHref} className="solid-button">
              Vào học ngay <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
            <Link href="/parent/courses" className="ghost-button">
              Xem khóa đã mua
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Link href={trialAnchorHref} className="ghost-button">
            Xem học thử trước
          </Link>
          {pricing.isPurchasable ? (
            <CourseCheckoutButton
              courseSlug={courseSlug}
              label={checkoutCtaLabel}
              priceVnd={pricing.salePriceVnd}
              isAuthenticated={isAuthenticated}
              tracking={{ variant, bundleSlug: courseSlug }}
            />
          ) : (
            <Link href="/contact" className="ghost-button">
              Nhận tư vấn nhanh
            </Link>
          )}
          {!isAuthenticated && pricing.isPurchasable ? (
            <p className="text-xs text-slate-500">
              Hệ thống sẽ đưa bạn đến đăng nhập/đăng ký và quay lại đúng khóa học này để tiếp tục nhận khóa.
            </p>
          ) : null}
          {!pricing.isPurchasable ? (
            <p className="text-xs text-amber-700">
              {isPendingPricing
                ? `Khóa này đang tạm khóa thanh toán online. Phụ huynh vẫn xem thử ${COURSE_TRIAL_PREVIEW_LESSON_LIMIT} bài đầu.`
                : `Thanh toán online đang tạm khóa. Phụ huynh vẫn có thể xem thử ${COURSE_TRIAL_PREVIEW_LESSON_LIMIT} bài đầu.`}
            </p>
          ) : null}
        </div>
      )}

      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="inline-flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          Mua một lần, kích hoạt học ngay. Nếu chưa chắc level, hãy xem học thử trước.
        </p>
      </div>

      {!isOwned && pricing.isPurchasable ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Giá</p>
            <p className="text-base font-black text-emerald-700">{formatCurrency(pricing.salePriceVnd)}</p>
          </div>
          <CourseCheckoutButton
            courseSlug={courseSlug}
            label={checkoutCtaLabel}
            priceVnd={pricing.salePriceVnd}
            isAuthenticated={isAuthenticated}
            tracking={{ variant, bundleSlug: courseSlug }}
          />
        </div>
      ) : !isOwned ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-t border-emerald-200 bg-emerald-50/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-emerald-700">Giá hiện tại</p>
            <p className="text-sm font-black text-emerald-800">{formatCurrency(currentPriceVnd)}</p>
          </div>
          <Link href={trialAnchorHref} className="solid-button text-sm">
            Xem học thử
          </Link>
        </div>
      ) : null}
    </div>
  );
}
