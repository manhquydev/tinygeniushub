import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import type { StorefrontCourse } from "@/modules/courses/course-service";
import type { AbVariant } from "@/lib/ab-test-constants";
import { BundleDetailTrackedLink } from "@/components/courses/course-storefront-tracking";

interface CourseCardProps {
  course: StorefrontCourse;
  variant: AbVariant;
  index: number;
  detailCtaLabel: string;
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}D`;
}

function formatLessonCount(lessonCount: number) {
  return `${lessonCount.toLocaleString("vi-VN")}post`;
}

function formatDuration(durationDays: number) {
  if (durationDays % 7 === 0) {
    const weeks = durationDays / 7;
    return `${weeks.toLocaleString("vi-VN")}week`;
  }
  return `${durationDays.toLocaleString("vi-VN")}day`;
}

function formatPrice(course: StorefrontCourse) {
  const currentPrice = Math.max(0, course.pricing.salePriceVnd);
  const listPrice = course.pricing.listPriceVnd;
  const hasDiscount = listPrice > currentPrice;

  return {
    currentPriceLabel: currentPrice === 0 ? "Free of charge" : formatCurrency(currentPrice),
    listPriceLabel: hasDiscount ? formatCurrency(listPrice) : null,
  };
}

export function CourseCard({ course, variant, index, detailCtaLabel }: CourseCardProps) {
  const price = formatPrice(course);
  const href = `/courses/${course.slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="relative shrink-0 overflow-hidden">
        {course.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="h-44 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-44 w-full bg-[linear-gradient(145deg,#e2e8f0_0%,#f8fafc_55%,#ecfeff_100%)]" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 text-lg font-extrabold tracking-[-0.01em] text-slate-900">{course.title}</h2>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
            <BookOpen className="h-3.5 w-3.5" />
            {formatLessonCount(course.lessonCount)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDuration(course.durationDays)}
          </span>
        </div>

        <div className="mt-5">
          <p className="text-xs text-slate-500">Current price</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-lg font-black tracking-[-0.02em] text-emerald-700">{price.currentPriceLabel}</p>
            {price.listPriceLabel ? <p className="text-xs text-slate-400 line-through">{price.listPriceLabel}</p> : null}
          </div>
        </div>

        <div className="mt-4">
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
