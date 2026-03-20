import Link from "next/link";
import type { RelatedCourse } from "@/modules/courses/course-service";

type Props = { courses: RelatedCourse[] };

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function CourseRelatedSection({ courses }: Props) {
  if (courses.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-slate-900">Khóa học tương tự</h2>
      <div className="mt-4 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
        {courses.map((course) => (
          <div key={course.id} className="w-72 flex-shrink-0 snap-start">
            <Link
              href={`/courses/${course.slug}`}
              className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {course.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.coverImageUrl}
                  alt={course.title}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="h-36 w-full bg-[linear-gradient(145deg,#e2e8f0_0%,#f8fafc_55%,#ecfeff_100%)]" />
              )}
              <div className="p-3 space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{course.title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{course.lessonCount} bài</span>
                  <span>{course.durationDays} ngày</span>
                </div>
                {course.pricing.isPurchasable ? (
                  <p className="text-sm font-extrabold text-emerald-700">
                    {formatCurrency(course.pricing.salePriceVnd)}
                    {course.pricing.hasDiscount ? (
                      <span className="ml-1.5 text-xs font-normal text-slate-400 line-through">
                        {formatCurrency(course.pricing.listPriceVnd)}
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-sm font-bold text-amber-700">Giá đang cập nhật</p>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
