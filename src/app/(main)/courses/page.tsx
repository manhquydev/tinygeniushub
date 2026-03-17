import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, BarChart3, BookOpen, ShieldCheck } from "lucide-react";
import { AB_COURSES_COOKIE, type AbVariant } from "@/lib/ab-test-constants";
import { getStorefrontCourses } from "@/modules/courses/course-service";
import { getCourseBundleByCourseSlug } from "@/modules/courses/course-bundles";
import { getBundleStorefrontContent } from "@/modules/courses/course-storefront-content";
import { CourseCheckoutStatusBanner } from "@/components/courses/course-checkout-status-banner";
import {
  BundleDetailTrackedLink,
  CourseCatalogViewTracker,
} from "@/components/courses/course-storefront-tracking";

export const metadata: Metadata = {
  title: "Khóa học cho bé - Cùng Con Tự Học",
  description:
    "Khám phá khóa học theo mục tiêu rõ ràng, theo dõi tiến bộ từng tuần và bắt đầu học ngay.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/courses" },
};

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export default async function CoursesPage() {
  const [courses, cookieStore] = await Promise.all([getStorefrontCourses(), cookies()]);
  const coursesVariant: AbVariant = cookieStore.get(AB_COURSES_COOKIE)?.value === "B" ? "B" : "A";
  const totalLessons = courses.reduce((sum, course) => sum + course.lessonCount, 0);
  const totalDurationDays = courses.reduce((sum, course) => sum + course.durationDays, 0);

  const heroTitle =
    coursesVariant === "B"
      ? "Chọn đúng khóa để con tiến bộ ngay từ những tuần đầu"
      : "Mỗi khóa là một mục tiêu học rõ ràng, dễ theo dõi";
  const heroDescription =
    coursesVariant === "B"
      ? "Không còn mô hình một khóa lớn chứa nhiều khóa nhỏ. Bạn chọn trực tiếp từng khóa phù hợp để bắt đầu nhanh, đo được tiến bộ sớm."
      : "Danh sách hiển thị theo từng khóa độc lập: biết rõ học gì, học bao lâu, bao nhiêu bài và chi phí trước khi quyết định.";
  const detailCtaLabel = coursesVariant === "B" ? "Xem khóa và bắt đầu" : "Xem chi tiết khóa";

  return (
    <div className="page-stack">
      <CourseCheckoutStatusBanner />
      <CourseCatalogViewTracker
        variant={coursesVariant}
        bundles={courses.length}
        tracks={courses.length}
        lessons={totalLessons}
      />

      <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_40%,#f0fdf4_100%)] p-5 shadow-sm sm:p-8">
        <div className="grid gap-5">
          <p className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Danh sách khóa học độc lập
          </p>
          <div className="grid gap-3">
            <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-900 sm:text-4xl">{heroTitle}</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">{heroDescription}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/85 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Số khóa</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{courses.length}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/85 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Tổng bài học</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalLessons.toLocaleString("vi-VN")}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/85 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Tổng thời lượng</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalDurationDays} ngày</p>
            </div>
          </div>
        </div>
      </section>

      {courses.length === 0 ? (
        <section className="card items-center text-center" style={{ padding: "2.5rem 1.5rem" }}>
          <p className="text-lg font-bold text-slate-900">Sắp ra mắt khóa học mới</p>
          <p className="max-w-md text-sm leading-relaxed text-slate-600">
            Chúng tôi đang cập nhật thêm nội dung mới. Đăng ký để nhận thông báo ngay khi khóa học được mở bán.
          </p>
          <Link href="/waitlist" className="solid-button" style={{ marginTop: "0.5rem", width: "fit-content" }}>
            Nhận thông báo sớm
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, index) => {
            const bundle = getCourseBundleByCourseSlug(course.slug);
            const content = bundle ? getBundleStorefrontContent(bundle.slug) : null;

            return (
              <article
                key={course.slug}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
              >
                <div className="relative">
                  {course.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.coverImageUrl} alt={course.title} className="h-44 w-full object-cover sm:h-48" />
                  ) : (
                    <div className="h-44 w-full bg-[linear-gradient(145deg,#e2e8f0_0%,#f8fafc_55%,#ecfeff_100%)] sm:h-48" />
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
                    {course.lessonCount} bài học
                  </div>
                </div>

                <div className="grid gap-4 p-4 sm:p-5">
                  <div className="space-y-1.5">
                    {content ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">{content.shortLabel}</p>
                    ) : null}
                    <h2 className="text-lg font-extrabold tracking-[-0.01em] text-slate-900">{course.title}</h2>
                    <p className="text-sm leading-relaxed text-slate-600">{course.description}</p>
                  </div>

                  {content ? (
                    <div className="grid gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Phù hợp với</p>
                      <p className="text-sm leading-relaxed text-slate-700">{content.bestFor}</p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 p-2 text-center">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-500">Thời hạn</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{course.durationDays} ngày</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2 text-center">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-500">Bài học</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{course.lessonCount}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Giá khóa học</p>
                    <div className="mt-1 flex items-end gap-2">
                      <p className="text-2xl font-black tracking-[-0.02em] text-emerald-700">
                        {formatCurrency(course.pricing.salePriceVnd)}
                      </p>
                      {course.pricing.hasDiscount ? (
                        <p className="pb-1 text-xs text-slate-500 line-through">
                          {formatCurrency(course.pricing.listPriceVnd)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <BundleDetailTrackedLink
                    href={`/courses/${course.slug}`}
                    className="solid-button w-full"
                    variant={coursesVariant}
                    bundleSlug={course.slug}
                    ctaLabel={detailCtaLabel}
                    position={index + 1}
                  >
                    {detailCtaLabel} <ArrowRight className="ml-1 h-4 w-4" />
                  </BundleDetailTrackedLink>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Vì sao phụ huynh dễ quyết định hơn?</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BookOpen className="h-4 w-4 text-sky-600" />
              Mỗi card là một khóa
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Không còn lớp khóa lớn chứa khóa nhỏ. Chọn trực tiếp khóa phù hợp và đi thẳng vào nội dung cụ thể.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Thông tin rõ ràng
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Nhìn ngay số bài, thời lượng, giá và mô tả để so sánh nhanh trước khi mua.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              Mua và học liền mạch
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Mua theo từng khóa độc lập, kích hoạt nhanh và theo dõi tiến độ rõ trên hệ thống.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
