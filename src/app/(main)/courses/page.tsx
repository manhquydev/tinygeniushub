import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { BarChart3, BookOpen, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { AB_COURSES_COOKIE, type AbVariant } from "@/lib/ab-test-constants";
import { parseFilterParams, type CourseFilterParams } from "@/lib/courses/course-filter-utils";
import { getStorefrontCourses, type StorefrontCourse } from "@/modules/courses/course-service";
import { isPilotSkuSlug } from "@/modules/courses/pilot-sku-catalog";
import { CourseActiveFilters } from "@/components/courses/course-active-filters";
import { CourseCard } from "@/components/courses/course-card";
import { CourseCheckoutStatusBanner } from "@/components/courses/course-checkout-status-banner";
import { CourseFilterSidebar } from "@/components/courses/course-filter-sidebar";
import { CourseMobileFilterTrigger } from "@/components/courses/course-mobile-filter-trigger";
import { CoursePagination } from "@/components/courses/course-pagination";
import { CourseSortSelect } from "@/components/courses/course-sort-select";
import { CourseCatalogViewTracker } from "@/components/courses/course-storefront-tracking";

export const metadata: Metadata = {
  title: "Khóa học cho bé - Cùng Con Tự Học",
  description:
    "Khám phá khóa học theo mục tiêu rõ ràng, có bộ lọc nhanh theo độ tuổi, giá và thời lượng để chọn đúng khóa cho bé.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/courses" },
};

type SearchParamsInput = Record<string, string | string[] | undefined>;

interface CoursesPageProps {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
}

const PAGE_SIZE = 9;

function getActiveFilterCount(filters: CourseFilterParams) {
  let count = 0;
  if (filters.q) count += 1;
  if (filters.subject) count += 1;
  if (filters.ageGroup) count += 1;
  if (filters.duration) count += 1;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count += 1;
  return count;
}

function matchesDuration(durationDays: number, duration: CourseFilterParams["duration"]) {
  if (!duration) return true;
  if (duration === "short") return durationDays < 30;
  if (duration === "medium") return durationDays >= 30 && durationDays <= 60;
  return durationDays > 60;
}

function filterCourses(courses: StorefrontCourse[], filters: CourseFilterParams) {
  const normalizedQuery = filters.q?.trim().toLowerCase() ?? "";

  return courses.filter((course) => {
    const searchable = `${course.title} ${course.description}`.toLowerCase();
    if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;
    if (filters.subject && course.subject !== filters.subject) return false;
    if (filters.ageGroup && course.ageGroup !== filters.ageGroup) return false;
    if (filters.minPrice !== undefined && course.pricing.salePriceVnd < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && course.pricing.salePriceVnd > filters.maxPrice) return false;
    if (!matchesDuration(course.durationDays, filters.duration)) return false;
    return true;
  });
}

function sortCourses(courses: StorefrontCourse[], sort: CourseFilterParams["sort"]) {
  const items = [...courses];
  switch (sort) {
    case "newest":
      return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case "price_asc":
      return items.sort((a, b) => a.pricing.salePriceVnd - b.pricing.salePriceVnd);
    case "price_desc":
      return items.sort((a, b) => b.pricing.salePriceVnd - a.pricing.salePriceVnd);
    case "duration_asc":
      return items.sort((a, b) => a.durationDays - b.durationDays);
    default:
      return items;
  }
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const [courses, cookieStore, resolvedSearchParams] = await Promise.all([
    getStorefrontCourses(),
    cookies(),
    searchParams ?? {},
  ]);

  const coursesVariant: AbVariant = cookieStore.get(AB_COURSES_COOKIE)?.value === "B" ? "B" : "A";
  const filters = parseFilterParams(resolvedSearchParams);
  const activeFilterCount = getActiveFilterCount(filters);
  const filteredCourses = filterCourses(courses, filters);
  const sortedCourses = sortCourses(filteredCourses, filters.sort);

  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / PAGE_SIZE));
  const currentPage = Math.min(filters.page ?? 1, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleCourses = sortedCourses.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="page-stack">
      <CourseCheckoutStatusBanner />
      <CourseCatalogViewTracker
        variant={coursesVariant}
        bundles={visibleCourses.length}
        tracks={visibleCourses.length}
        lessons={visibleCourses.reduce((sum, course) => sum + course.lessonCount, 0)}
      />

      <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_40%,#f0fdf4_100%)] p-5 shadow-sm sm:p-8">
        <div className="grid gap-5">
          <p className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Khóa học cho phụ huynh chọn nhanh
          </p>
          <div className="grid gap-3">
            <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-900 sm:text-4xl">
              Chọn đúng khóa cho con trong 60 giây
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Mỗi khóa đều trả lời rõ 3 câu hỏi: con học gì, có hợp không, và ba mẹ theo dõi tiến bộ ra sao.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/85 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Con học gì</p>
              <p className="mt-1 text-sm font-black text-slate-900">Xem trước nội dung và mục tiêu của từng khóa</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Đủ để biết con sẽ học gì trước khi mở chi tiết.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/85 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Có hợp không</p>
              <p className="mt-1 text-sm font-black text-slate-900">Lọc theo tuổi, giá, thời lượng</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Rút gọn số khóa cần mở để so sánh kỹ.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/85 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Theo dõi tiến bộ</p>
              <p className="mt-1 text-sm font-black text-slate-900">Thông tin theo dõi hiển thị ngay trên card</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Giúp ba mẹ quay lại kiểm tra và quyết định nhanh hơn.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky z-20" style={{ top: "calc(var(--app-nav-height) + 0.9rem)" }}>
            <div className="max-h-[calc(100dvh-var(--app-nav-height)-1.2rem)] overflow-y-auto pr-1">
              <CourseFilterSidebar
                key={`desktop-${filters.q ?? ""}-${filters.minPrice ?? ""}-${filters.maxPrice ?? ""}-${filters.subject ?? ""}-${filters.ageGroup ?? ""}-${filters.duration ?? ""}`}
                currentFilters={filters}
              />
            </div>
          </div>
        </aside>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CourseMobileFilterTrigger currentFilters={filters} activeFilterCount={activeFilterCount} />
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Bộ lọc thông minh
                </span>
              </div>
              <CourseSortSelect currentSort={filters.sort} />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Hiển thị <span className="font-bold text-slate-900">{visibleCourses.length}</span> /{" "}
              <span className="font-bold text-slate-900">{filteredCourses.length}</span> khóa phù hợp.
            </p>
            <div className="mt-3">
              <CourseActiveFilters filters={filters} />
            </div>
          </div>

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
          ) : visibleCourses.length === 0 ? (
            <section className="card items-center text-center" style={{ padding: "2.2rem 1.25rem" }}>
              <p className="text-lg font-bold text-slate-900">Chưa tìm thấy khóa phù hợp</p>
              <p className="max-w-md text-sm leading-relaxed text-slate-600">
                Thử nới bộ lọc để xem thêm lựa chọn cho con.
              </p>
              <Link href="/courses" className="ghost-button" style={{ width: "fit-content" }}>
                Xóa bộ lọc
              </Link>
            </section>
          ) : (
            <>
              <section className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleCourses.map((course, index) => {
                  return (
                    <CourseCard
                      key={course.slug}
                      course={course}
                      showPilotBadge={isPilotSkuSlug(course.slug)}
                      variant={coursesVariant}
                      index={startIndex + index}
                      detailCtaLabel="Xem có hợp con không"
                    />
                  );
                })}
              </section>
              <CoursePagination page={currentPage} totalPages={totalPages} />
            </>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Vì sao phụ huynh quyết định nhanh hơn?</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BookOpen className="h-4 w-4 text-sky-600" />
              Tập trung vào điều quan trọng
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Mỗi card chỉ giữ thông tin giúp phụ huynh ra quyết định, tránh dồn quá nhiều dữ liệu kỹ thuật.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              So sánh nhanh theo nhu cầu thật
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Lọc theo độ tuổi, học phí, thời lượng để rút ngắn thời gian tìm khóa phù hợp cho con.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              Quyết định có điểm tựa
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Dễ đối chiếu tiến độ sau khi học thử và nhận hỗ trợ chọn lộ trình trước khi chốt đăng ký.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
