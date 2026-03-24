import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import type { StorefrontCourse } from "@/modules/courses/course-service";
import type { AbVariant } from "@/lib/ab-test-constants";
import type { BundleStorefrontContent } from "@/modules/courses/course-storefront-content";
import { AGE_GROUP_LABELS } from "@/lib/courses/course-filter-utils";
import { BundleDetailTrackedLink } from "@/components/courses/course-storefront-tracking";

interface CourseCardProps {
  course: StorefrontCourse;
  bundleContent: BundleStorefrontContent | null;
  showPilotBadge: boolean;
  variant: AbVariant;
  index: number;
  detailCtaLabel: string;
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function CourseCard({
  course,
  bundleContent,
  showPilotBadge,
  variant,
  index,
  detailCtaLabel,
}: CourseCardProps) {
  const ageLabel = course.ageGroup ? (AGE_GROUP_LABELS[course.ageGroup] ?? null) : null;
  const showRating = course.reviewCount > 0 && course.reviewAverageRating !== null;
  const showEnrollment = course.enrollmentCount > 0;
  const href = `/courses/${course.slug}`;

  return (
    <article className="relative group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      {/* Full-card overlay link — makes entire card clickable */}
      <Link href={href} className="absolute inset-0 z-0" aria-label={`Xem chi tiết khóa ${course.title}`} />

      {/* Cover image */}
      <div className="relative overflow-hidden">
        {course.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="h-44 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] sm:h-48"
          />
        ) : (
          <div className="h-44 w-full bg-[linear-gradient(145deg,#e2e8f0_0%,#f8fafc_55%,#ecfeff_100%)] transition-transform duration-200 group-hover:scale-[1.02] sm:h-48" />
        )}
        {/* Age badge (top-right) */}
        {ageLabel ? (
          <div className="absolute right-3 top-3 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {ageLabel}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 p-4 sm:p-5">
        {/* Track label + title + description */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {bundleContent ? (
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
                {bundleContent.shortLabel}
              </p>
            ) : null}
            {showPilotBadge ? (
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
                Pilot 4-8 tuần
              </span>
            ) : null}
          </div>
          <h2 className="text-lg font-extrabold tracking-[-0.01em] text-slate-900 transition-colors duration-150 group-hover:text-emerald-700">
            {course.title}
          </h2>
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{course.description}</p>
        </div>

        {/* Rating + enrollment row */}
        {(showRating || showEnrollment) ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {showRating ? (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {course.reviewAverageRating!.toFixed(1)}
                <span className="font-normal text-slate-500">({course.reviewCount} đánh giá)</span>
              </span>
            ) : null}
            {showEnrollment ? (
              <span className="text-slate-500">{course.enrollmentCount.toLocaleString("vi-VN")} gia đình đã mua</span>
            ) : null}
          </div>
        ) : null}

        {/* Price */}
        <div className="flex items-end gap-2">
          {course.pricing.isPurchasable ? (
            <>
              <p className="text-xl font-black tracking-[-0.02em] text-emerald-700">
                {formatCurrency(course.pricing.salePriceVnd)}
              </p>
              {course.pricing.hasDiscount ? (
                <p className="pb-0.5 text-xs text-slate-400 line-through">
                  {formatCurrency(course.pricing.listPriceVnd)}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm font-bold text-amber-700">Giá đang cập nhật</p>
          )}
        </div>

        {/* CTA — relative z-10 to sit above card overlay */}
        <div className="relative z-10">
          <BundleDetailTrackedLink
            href={href}
            className="solid-button w-full"
            variant={variant}
            bundleSlug={course.slug}
            ctaLabel={detailCtaLabel}
            position={index + 1}
          >
            {detailCtaLabel} <ArrowRight className="ml-1 h-4 w-4" />
          </BundleDetailTrackedLink>
        </div>
      </div>
    </article>
  );
}
