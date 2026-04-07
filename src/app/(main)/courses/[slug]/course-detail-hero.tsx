import { Star } from "lucide-react";
import type { AbVariant } from "@/lib/ab-test-constants";
import type { CourseBundleDefinition } from "@/modules/courses/course-bundles";
import type { CourseDisplayPricing } from "@/modules/courses/course-pricing";
import {
  getBundleStorefrontContent,
  type CourseClaritySnapshot,
} from "@/modules/courses/course-storefront-content";
import { CourseDetailSidebar } from "@/components/courses/course-detail-sidebar";

type Props = {
  slug: string;
  title: string;
  description: string;
  lessonCount: number;
  durationDays: number;
  normalizedCover: string | null;
  bundle: CourseBundleDefinition | null;
  pricing: Pick<
    CourseDisplayPricing,
    "salePriceVnd" | "listPriceVnd" | "hasDiscount" | "isPurchasable" | "saleEndsAt" | "statusLabel"
  >;
  isOwned: boolean;
  isAuthenticated: boolean;
  childEntryHref: string;
  variant: AbVariant;
  checkoutLabel: string;
  reviewAverageRating: number | null;
  reviewCount: number;
  enrollmentCount: number;
  trackPosition: number | null;
  trackTotal: number | null;
  trackLabel: string | null;
  claritySnapshot: CourseClaritySnapshot | null;
};

export function CourseDetailHero({
  slug,
  title,
  description,
  lessonCount,
  durationDays,
  normalizedCover,
  bundle,
  pricing,
  isOwned,
  isAuthenticated,
  childEntryHref,
  variant,
  checkoutLabel,
  reviewAverageRating,
  reviewCount,
  enrollmentCount,
  trackPosition,
  trackTotal,
  trackLabel,
  claritySnapshot,
}: Props) {
  const bundleContent = bundle ? getBundleStorefrontContent(bundle.slug) : null;
  const showRating = reviewCount > 0 && reviewAverageRating !== null;
  const showEnrollment = enrollmentCount > 0;
  const quickBestFor = bundleContent?.bestFor ? [bundleContent.bestFor] : [];
  const phaseHint =
    trackPosition && trackTotal && trackLabel
      ? `Bạn đang xem giai đoạn ${trackPosition}/${trackTotal} trong lộ trình ${trackLabel}.`
      : null;
  const cadenceHint = claritySnapshot
    ? `Nhịp học khuyến nghị: ${claritySnapshot.pacePerWeek} ${claritySnapshot.unitLabel}/tuần.`
    : "Nhịp học khuyến nghị: 4-5 bài/tuần, ưu tiên đều đặn.";
  const bestForHint = bundleContent?.bestFor ?? null;

  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-[linear-gradient(145deg,#f0fdf4_0%,#ffffff_55%,#ecfeff_100%)] p-5 shadow-sm sm:p-8">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-4">
          {normalizedCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={normalizedCover}
              alt={title}
              className="w-full rounded-2xl object-cover shadow-[0_16px_34px_rgba(15,23,42,0.12)]"
              style={{ aspectRatio: "16 / 9" }}
            />
          ) : (
            <div
              className="w-full rounded-2xl bg-[linear-gradient(145deg,#e2e8f0_0%,#f8fafc_55%,#ecfeff_100%)]"
              style={{ aspectRatio: "16 / 9" }}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Bài học</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{lessonCount}</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Thời hạn</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{durationDays} ngày</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Nhịp gợi ý</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {claritySnapshot ? `${claritySnapshot.pacePerWeek} ${claritySnapshot.unitLabel}/tuần` : "4-5 bài/tuần"}
              </p>
            </div>
          </div>

          {(showRating || showEnrollment) ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              {showRating ? (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {reviewAverageRating!.toFixed(1)}
                  <span className="font-normal text-slate-500">({reviewCount} đánh giá)</span>
                </span>
              ) : null}
              {showEnrollment ? (
                <span className="text-slate-500">{enrollmentCount.toLocaleString("vi-VN")} gia đình đã mua</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4">
          <p className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
            {trackPosition && trackTotal && trackLabel
              ? `Lộ trình ${trackPosition}/${trackTotal} - ${trackLabel}`
              : "Khóa học độc lập"}
          </p>

          <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-900 sm:text-4xl">{title}</h1>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>
          <p className="text-sm font-semibold text-slate-700">
            Dành cho phụ huynh muốn con học đều và thấy tiến bộ rõ theo tuần.
          </p>

          {(quickBestFor.length > 0 || claritySnapshot) ? (
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">Gợi ý quyết định nhanh</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {quickBestFor.map((line) => (
                  <li key={line} className="inline-flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                    <span>{line}</span>
                  </li>
                ))}
                {claritySnapshot ? (
                  <li className="inline-flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600" />
                    <span>Nhịp đề xuất: {claritySnapshot.pacePerWeek} {claritySnapshot.unitLabel}/tuần.</span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {bundleContent?.promise ? (
            <p className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm leading-relaxed text-sky-800">
              {bundleContent.promise}
            </p>
          ) : null}

          <CourseDetailSidebar
            courseSlug={slug}
            pricing={pricing}
            isOwned={isOwned}
            isAuthenticated={isAuthenticated}
            childEntryHref={childEntryHref}
            variant={variant}
            checkoutLabel={checkoutLabel}
            personalization={{
              phaseHint,
              bestFor: bestForHint,
              cadenceHint,
            }}
          />
        </div>
      </div>
    </section>
  );
}

