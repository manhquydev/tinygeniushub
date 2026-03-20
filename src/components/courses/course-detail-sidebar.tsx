import Link from "next/link";
import { CalendarDays, ChevronRight, CircleCheckBig, Clock3, ShieldCheck } from "lucide-react";
import { CourseCheckoutButton } from "@/components/courses/course-checkout-button";
import { FitCheckTrackedLink } from "@/components/courses/course-storefront-tracking";
import type { AbVariant } from "@/lib/ab-test-constants";

type Props = {
  courseSlug: string;
  pricing: { salePriceVnd: number; listPriceVnd: number; hasDiscount: boolean; isPurchasable: boolean };
  isOwned: boolean;
  isAuthenticated: boolean;
  childEntryHref: string;
  variant: AbVariant;
  checkoutLabel: string;
};

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
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
  return (
    <div className="sticky top-6 space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Giá thanh toán</p>
        {pricing.isPurchasable ? (
          <>
            <div className="mt-1 flex items-end gap-2">
              <p className="text-3xl font-black tracking-[-0.02em] text-emerald-700">
                {formatCurrency(pricing.salePriceVnd)}
              </p>
              {pricing.hasDiscount ? (
                <p className="pb-1 text-sm text-slate-500 line-through">{formatCurrency(pricing.listPriceVnd)}</p>
              ) : null}
            </div>
            <p className="text-xs text-emerald-700/80">Thanh toán một lần, kích hoạt ngay sau xác nhận</p>
          </>
        ) : (
          <p className="mt-2 text-sm font-semibold text-amber-700">Giá đang cập nhật. Vui lòng liên hệ tư vấn trước khi mua.</p>
        )}
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
            <FitCheckTrackedLink
              href="#fit-checklist"
              className="ghost-button"
              variant={variant}
              sourcePage="course_detail"
              ctaLabel="Xem checklist phù hợp"
              bundleSlug={courseSlug}
            >
              Xem checklist phù hợp
            </FitCheckTrackedLink>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          {pricing.isPurchasable ? (
            <CourseCheckoutButton
              courseSlug={courseSlug}
              label={checkoutLabel}
              priceVnd={pricing.salePriceVnd}
              isAuthenticated={isAuthenticated}
              tracking={{ variant, bundleSlug: courseSlug }}
            />
          ) : (
            <Link href="/contact" className="solid-button">
              Liên hệ tư vấn giá
            </Link>
          )}
          <FitCheckTrackedLink
            href="#fit-checklist"
            className="ghost-button"
            variant={variant}
            sourcePage="course_detail"
            ctaLabel="Kiểm tra độ phù hợp trước khi mua"
            bundleSlug={courseSlug}
          >
            Kiểm tra độ phù hợp trước khi mua
          </FitCheckTrackedLink>
          {!isAuthenticated && pricing.isPurchasable ? (
            <p className="text-xs text-slate-500">
              Hệ thống sẽ đưa bạn đến đăng nhập hoặc đăng ký, rồi quay lại đúng khóa học này để tiếp tục thanh toán.
            </p>
          ) : null}
          {!pricing.isPurchasable ? (
            <p className="text-xs text-amber-700">Checkout tạm khóa cho khóa học chưa có giá hợp lệ.</p>
          ) : null}
        </div>
      )}

      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="inline-flex items-start gap-2">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          Truy cập khóa học ngay sau khi giao dịch thành công.
        </p>
        <p className="inline-flex items-start gap-2">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          Trạng thái thanh toán được cập nhật tự động trên hệ thống.
        </p>
        <p className="inline-flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          Theo dõi tiến bộ rõ theo số bài hoàn thành và mốc tuần học.
        </p>
      </div>

      {/* Mobile sticky bottom CTA */}
      {!isOwned && pricing.isPurchasable ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Giá</p>
            <p className="text-base font-black text-emerald-700">{formatCurrency(pricing.salePriceVnd)}</p>
          </div>
          <CourseCheckoutButton
            courseSlug={courseSlug}
            label={checkoutLabel}
            priceVnd={pricing.salePriceVnd}
            isAuthenticated={isAuthenticated}
            tracking={{ variant, bundleSlug: courseSlug }}
          />
        </div>
      ) : null}
    </div>
  );
}
