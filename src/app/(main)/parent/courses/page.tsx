import Link from "next/link";
import { Award, BookOpen, CalendarDays, ChevronRight, Clock3 } from "lucide-react";
import { requireParent } from "@/lib/auth/require-parent";
import { getParentEnrollments } from "@/modules/courses/course-service";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";
import { isLegacyBundleRouteSlug } from "@/modules/courses/legacy-bundle-routes";
import { CourseCheckoutStatusBanner } from "@/components/courses/course-checkout-status-banner";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("vi-VN");
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export default async function ParentCoursesPage() {
  const parent = await requireParent();
  const enrollments = await getParentEnrollments(parent.id);

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((enrollment) => Boolean(enrollment.completedAt)).length;
  const completionRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  return (
    <div className="page-stack">
      <CourseCheckoutStatusBanner />

      <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-[linear-gradient(155deg,#eff6ff_0%,#ffffff_55%,#f0fdf4_100%)] p-5 shadow-sm sm:p-8">
        <div className="grid gap-4">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-3xl">
            <BookOpen className="h-6 w-6 text-sky-600" />
            Khóa học của tôi
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Danh sách hiển thị theo từng khóa độc lập bạn đã mua, giúp theo dõi tiến độ và quay lại học nhanh.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Số khóa đã mua</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalCourses}</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Khóa hoàn thành</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">{completedCourses}</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Tiến độ tổng</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{completionRate}%</p>
            </div>
          </div>
        </div>
      </section>

      {enrollments.length === 0 ? (
        <section className="card items-center text-center" style={{ padding: "2.25rem 1.25rem" }}>
          <p className="text-lg font-bold text-slate-900">Bạn chưa mua khóa học nào</p>
          <p className="max-w-md text-sm leading-relaxed text-slate-600">
            Khám phá khóa học theo mục tiêu của bé. Sau khi thanh toán thành công, khóa học sẽ được mở ngay.
          </p>
          <Link href="/courses" className="solid-button" style={{ width: "fit-content" }}>
            Xem khóa học đang mở bán
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {enrollments.map((enrollment) => {
            const pricing = resolveCourseDisplayPricing(enrollment.course);
            const detailHref = isLegacyBundleRouteSlug(enrollment.course.slug)
              ? "/courses"
              : `/courses/${enrollment.course.slug}`;

            return (
              <article
                key={enrollment.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
              >
                <div className="relative">
                  {enrollment.course.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={enrollment.course.coverImageUrl} alt={enrollment.course.title} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="h-44 w-full bg-[linear-gradient(145deg,#e2e8f0_0%,#f8fafc_55%,#ecfeff_100%)]" />
                  )}
                  <div
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                      enrollment.completedAt
                        ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                    }`}
                  >
                    {enrollment.completedAt ? "Đã hoàn thành" : "Đang học"}
                  </div>
                </div>

                <div className="grid gap-3 p-4 sm:p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-extrabold tracking-[-0.01em] text-slate-900">{enrollment.course.title}</h2>
                    <p className="text-sm leading-relaxed text-slate-600">{enrollment.course.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Đăng ký {formatDate(enrollment.enrolledAt)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {enrollment.course.durationDays} ngày truy cập
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                      Giá {formatCurrency(pricing.salePriceVnd)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={detailHref} className="solid-button" style={{ width: "fit-content" }}>
                      Xem khóa <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                    {enrollment.certificateUrl ? (
                      <a
                        href={enrollment.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ghost-button"
                      >
                        <Award className="mr-1 h-4 w-4" /> Tải chứng chỉ
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Mua thêm khóa học mới</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Bạn có thể mua thêm khóa học bất kỳ lúc nào để mở rộng lộ trình học cho bé.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/courses" className="solid-button">
            Xem tất cả khóa học
          </Link>
          <Link href="/parent/billing" className="ghost-button">
            Xem lịch sử thanh toán
          </Link>
        </div>
      </section>
    </div>
  );
}
