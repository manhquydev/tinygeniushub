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
  return `${amount.toLocaleString("vi-VN")}D`;
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
  const checkoutCtaLabel = isFreeSale ? "Get your free key now" : checkoutLabel;

  return (
    <div className="sticky top-6 space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Course price</p>
        <div className="mt-1 flex items-end gap-2">
          <p className="text-3xl font-black tracking-[-0.02em] text-emerald-700">{formatCurrency(currentPriceVnd)}</p>
          {showDiscount ? (
            <p className="pb-1 text-sm text-slate-500 line-through">{formatCurrency(pricing.listPriceVnd)}</p>
          ) : null}
        </div>
        {showDiscount ? (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
            {isFreeSale ? "Temporary 100% discount" : "Discounted from original price"}
          </p>
        ) : null}
        {showDiscount && saleEndsAtLabel ? (
          <p className="mt-1 text-xs text-emerald-700/80">Sale ends: {saleEndsAtLabel}</p>
        ) : null}
        <p className="mt-1 text-xs text-emerald-700/80">
          {pricing.isPurchasable
            ? isFreeSale
              ? "Register now to open the entire course with a 0 VND discount for a limited time."
              : "Buy once, start studying immediately after successful payment."
            : isPendingPricing
              ? `This course is temporarily suspending online registration. While waiting, parents can preview ${COURSE_TRIAL_PREVIEW_LESSON_LIMIT} first lesson.`
              : `Parents can still check it out${COURSE_TRIAL_PREVIEW_LESSON_LIMIT}First lesson before finalizing the route.`}
        </p>
      </div>

      {isOwned ? (
        <div className="grid gap-3 rounded-2xl border border-emerald-200 bg-white p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CircleCheckBig className="h-4 w-4" />
            You already own this course.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={childEntryHref} className="solid-button">
              Start learning now <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
            <Link href="/parent/courses" className="ghost-button">
              View purchased keys
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Link href={trialAnchorHref} className="ghost-button">
            See trial lessons first
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
              Get quick advice
            </Link>
          )}
          {!isAuthenticated && pricing.isPurchasable ? (
            <p className="text-xs text-slate-500">
              Log in to complete your registration, then return to this course.
            </p>
          ) : null}
          {!pricing.isPurchasable ? (
            <p className="text-xs text-amber-700">
              {isPendingPricing
                ? `This course is temporarily suspending online registration. Parents can still check out the first ${COURSE_TRIAL_PREVIEW_LESSON_LIMIT} lesson.`
                : `Online registration is temporarily suspended. Parents can still check it out${COURSE_TRIAL_PREVIEW_LESSON_LIMIT}first post.`}
            </p>
          ) : null}
        </div>
      )}

      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="inline-flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          Buy once, start learning right away. If you're not sure about the level, take a trial class first.
        </p>
      </div>

      {!isOwned && pricing.isPurchasable ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Price</p>
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
            <p className="text-[10px] uppercase tracking-[0.08em] text-emerald-700">Current price</p>
            <p className="text-sm font-black text-emerald-800">{formatCurrency(currentPriceVnd)}</p>
          </div>
          <Link href={trialAnchorHref} className="solid-button text-sm">
            See trial lesson
          </Link>
        </div>
      ) : null}
    </div>
  );
}
