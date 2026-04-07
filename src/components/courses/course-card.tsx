import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import type { StorefrontCourse } from "@/modules/courses/course-service";
import type { AbVariant } from "@/lib/ab-test-constants";
import { AGE_GROUP_LABELS } from "@/lib/courses/course-filter-utils";
import { BundleDetailTrackedLink } from "@/components/courses/course-storefront-tracking";

interface CourseCardProps {
  course: StorefrontCourse;
  showPilotBadge: boolean;
  variant: AbVariant;
  index: number;
  detailCtaLabel: string;
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function formatLessonCount(lessonCount: number) {
  return `${lessonCount.toLocaleString("vi-VN")} bài`;
}

function formatDuration(durationDays: number) {
  return `${durationDays.toLocaleString("vi-VN")} ngày`;
}

function formatPrice(course: StorefrontCourse) {
  const currentPrice = Math.max(0, course.pricing.salePriceVnd);
  const listPrice = course.pricing.listPriceVnd;
  const hasDiscount = listPrice > currentPrice;

  return {
    currentPriceLabel: formatCurrency(currentPrice),
    listPriceLabel: hasDiscount ? formatCurrency(listPrice) : null,
    showDiscount: hasDiscount,
  };
}

export function CourseCard({
  course,
  showPilotBadge,
  variant,
  index,
  detailCtaLabel,
}: CourseCardProps) {
  const ageLabel = course.ageGroup ? (AGE_GROUP_LABELS[course.ageGroup] ?? null) : null;
  const trackLabel = course.trackLabel;
  const price = formatPrice(course);
  const href = `/courses/${course.slug}`;

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.09)]">
      <Link href={href} className="absolute inset-0 z-0" aria-label={`Xem chi tiết khóa ${course.title}`} />

      <div className="relative shrink-0 overflow-hidden">
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/25 to-transparent" />
        {ageLabel ? (
          <div className="absolute right-3 top-3 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {ageLabel}
          </div>
        ) : null}
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-5">
        <div className="grid flex-1 gap-3">
          <section className="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(15,118,110,0.06),rgba(255,255,255,0.92))] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Con học gì</p>
            <h2 className="mt-2 line-clamp-2 text-lg font-extrabold tracking-[-0.01em] text-slate-900 transition-colors duration-150 group-hover:text-emerald-700">
              {course.title}
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{course.description}</p>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Có hợp không</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {trackLabel}
                  </span>
                  {ageLabel ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {ageLabel}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Phù hợp theo lộ trình
                    </span>
                  )}
                  {showPilotBadge ? (
                    <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
                      Lộ trình 4-8 tuần
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Giá hiện tại</p>
                <div className="mt-1">
                  <p className="text-base font-black tracking-[-0.02em] text-emerald-700">{price.currentPriceLabel}</p>
                  {price.listPriceLabel ? (
                    <p className="text-xs text-slate-400 line-through">{price.listPriceLabel}</p>
                  ) : null}
                  {price.showDiscount ? (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                      So với giá gốc
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Theo dõi tiến bộ</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/80 bg-white px-3 py-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Số bài</p>
                </div>
                <p className="mt-1 text-sm font-bold text-slate-900">{formatLessonCount(course.lessonCount)}</p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white px-3 py-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Thời lượng</p>
                </div>
                <p className="mt-1 text-sm font-bold text-slate-900">{formatDuration(course.durationDays)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span>
                Video phân bổ thực tế: <strong>{course.videoCount.toLocaleString("vi-VN")}</strong>
              </span>
            </div>
          </section>
        </div>

        <div className="relative z-10 mt-auto pt-4">
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
