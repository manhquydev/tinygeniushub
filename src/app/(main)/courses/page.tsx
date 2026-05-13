import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { SlidersHorizontal } from "lucide-react";
import { AB_COURSES_COOKIE, type AbVariant } from "@/lib/ab-test-constants";
import {
  AGE_GROUP_LABELS,
  PHASE_LABELS,
  PROGRAM_LABELS,
  parseFilterParams,
  SUBJECT_LABELS,
  type CourseFilterParams,
} from "@/lib/courses/course-filter-utils";
import { getStorefrontCourses, type StorefrontCourse } from "@/modules/courses/course-service";
import { CourseActiveFilters } from "@/components/courses/course-active-filters";
import { CourseCard } from "@/components/courses/course-card";
import { CourseCheckoutStatusBanner } from "@/components/courses/course-checkout-status-banner";
import { CourseFilterSidebar } from "@/components/courses/course-filter-sidebar";
import { CourseMobileFilterTrigger } from "@/components/courses/course-mobile-filter-trigger";
import { CoursePagination } from "@/components/courses/course-pagination";
import { CourseSortSelect } from "@/components/courses/course-sort-select";
import { CourseCatalogViewTracker } from "@/components/courses/course-storefront-tracking";

export const metadata: Metadata = {
  title: "Khóa học cho bé - TinyGenius Hub",
  description: "Xem nhanh khóa học, học thử trước, chọn mua đúng nhu cầu của gia đình.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/courses" },
};

type SearchParamsInput = Record<string, string | string[] | undefined>;

interface CoursesPageProps {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
}

const PAGE_SIZE = 9;
type ProgramKey = keyof typeof PROGRAM_LABELS;
type PhaseKey = keyof typeof PHASE_LABELS;

function getActiveFilterCount(filters: CourseFilterParams) {
  let count = 0;
  if (filters.q) count += 1;
  if (filters.program) count += 1;
  if (filters.phase) count += 1;
  if (filters.subject) count += 1;
  if (filters.ageGroup) count += 1;
  if (filters.duration) count += 1;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count += 1;
  return count;
}

function detectProgramKey(slug: string): ProgramKey | null {
  const normalized = slug.toLowerCase();
  if (normalized.startsWith("abeka-")) return "abeka";
  if (normalized.startsWith("lfen-")) return "lfen";
  if (normalized.startsWith("lfcn-")) return "lfcn";
  return null;
}

function detectPhaseKey(slug: string): PhaseKey | null {
  const normalized = slug.toLowerCase();
  if (normalized.includes("-intro-")) return "intro";
  if (normalized.includes("-starter-")) return "starter";
  if (normalized.includes("-foundation-")) return "foundation";
  if (normalized.includes("-builder-")) return "builder";
  return null;
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
    if (filters.program && detectProgramKey(course.slug) !== filters.program) return false;
    if (filters.phase && detectPhaseKey(course.slug) !== filters.phase) return false;
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

function deriveFilterOptions(courses: StorefrontCourse[]) {
  const isKnownSubject = (value: string | null): value is string => {
    return typeof value === "string" && value in SUBJECT_LABELS;
  };
  const isKnownAgeGroup = (value: string | null): value is string => {
    return typeof value === "string" && value !== "ALL_AGES" && value in AGE_GROUP_LABELS;
  };

  const isKnownProgram = (value: ProgramKey | null): value is ProgramKey => {
    return value !== null;
  };
  const isKnownPhase = (value: PhaseKey | null): value is PhaseKey => {
    return value !== null;
  };

  const programKeys = Array.from(
    new Set(
      courses
        .map((course) => detectProgramKey(course.slug))
        .filter(isKnownProgram),
    ),
  ).sort((a, b) => PROGRAM_LABELS[a].localeCompare(PROGRAM_LABELS[b], "vi"));

  const phaseKeys = Array.from(
    new Set(
      courses
        .map((course) => detectPhaseKey(course.slug))
        .filter(isKnownPhase),
    ),
  ).sort((a, b) => PHASE_LABELS[a].localeCompare(PHASE_LABELS[b], "vi"));

  const subjectKeys = Array.from(
    new Set(
      courses
        .map((course) => course.subject)
        .filter(isKnownSubject),
    ),
  ).sort((a, b) => SUBJECT_LABELS[a].localeCompare(SUBJECT_LABELS[b], "vi"));

  const ageGroupKeys = Array.from(
    new Set(
      courses
        .map((course) => course.ageGroup)
        .filter(isKnownAgeGroup),
    ),
  ).sort((a, b) => AGE_GROUP_LABELS[a].localeCompare(AGE_GROUP_LABELS[b], "vi"));

  return { programKeys, phaseKeys, subjectKeys, ageGroupKeys };
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
  const filterOptions = deriveFilterOptions(courses);

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

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-3xl">Danh sách khóa học</h1>
        <p className="mt-2 text-sm text-slate-600">Xem học thử trước khi mua để chọn đúng khóa cho bé.</p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky z-20" style={{ top: "calc(var(--app-nav-height) + 0.9rem)" }}>
            <div className="max-h-[calc(100dvh-var(--app-nav-height)-1.2rem)] overflow-y-auto pr-1">
              <CourseFilterSidebar
                key={`desktop-${filters.q ?? ""}-${filters.program ?? ""}-${filters.phase ?? ""}-${filters.minPrice ?? ""}-${filters.maxPrice ?? ""}-${filters.subject ?? ""}-${filters.ageGroup ?? ""}-${filters.duration ?? ""}`}
                currentFilters={filters}
                availableProgramKeys={filterOptions.programKeys}
                availablePhaseKeys={filterOptions.phaseKeys}
                availableSubjectKeys={filterOptions.subjectKeys}
                availableAgeGroupKeys={filterOptions.ageGroupKeys}
              />
            </div>
          </div>
        </aside>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CourseMobileFilterTrigger
                  currentFilters={filters}
                  activeFilterCount={activeFilterCount}
                  availableProgramKeys={filterOptions.programKeys}
                  availablePhaseKeys={filterOptions.phaseKeys}
                  availableSubjectKeys={filterOptions.subjectKeys}
                  availableAgeGroupKeys={filterOptions.ageGroupKeys}
                />
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Bộ lọc
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
              <p className="max-w-md text-sm leading-relaxed text-slate-600">Thử nới bộ lọc để xem thêm lựa chọn cho con.</p>
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
                      variant={coursesVariant}
                      index={startIndex + index}
                      detailCtaLabel="Xem chi tiết"
                    />
                  );
                })}
              </section>
              <CoursePagination page={currentPage} totalPages={totalPages} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
