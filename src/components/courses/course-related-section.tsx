import Link from "next/link";
import type { RelatedCourse } from "@/modules/courses/course-service";

type Props = { courses: RelatedCourse[] };

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}D`;
}

export function CourseRelatedSection({ courses }: Props) {
  if (courses.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-slate-900">Similar courses</h2>
      <div className="-mx-1 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
        {courses.map((course) => {
          const currentPrice = Math.max(0, course.pricing.salePriceVnd);
          const hasDiscount = course.pricing.listPriceVnd > currentPrice;

          return (
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
                <div className="space-y-1.5 p-3">
                  <h3 className="line-clamp-2 text-sm font-bold text-slate-900">{course.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{course.lessonCount} lessons</span>
                    <span>{course.durationDays} days</span>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-emerald-700">{formatCurrency(currentPrice)}</p>
                    {hasDiscount ? (
                      <p className="text-xs text-slate-400 line-through">{formatCurrency(course.pricing.listPriceVnd)}</p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
