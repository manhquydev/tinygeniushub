import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, Clock3, Grid3X3, List, Search } from "lucide-react";
import { requireParent } from "@/lib/auth/require-parent";
import { getCourseProgressForParent } from "@/modules/courses/course-service";
import { listEntitledCoursesForParent } from "@/modules/courses/entitled-course-lists";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";
import { isLegacyBundleRouteSlug } from "@/modules/courses/legacy-bundle-routes";
import { CourseCheckoutStatusBanner } from "@/components/courses/course-checkout-status-banner";
import { prisma } from "@/lib/db";

type ParentCourseStatus = "all" | "learning" | "completed" | "not_started";
type ParentCourseSort = "recent" | "progress_desc" | "title_asc";
type ParentCourseView = "grid" | "list";

type ParentCoursesSearchParams = Record<string, string | string[] | undefined>;

interface ParentCoursesPageProps {
  searchParams?: Promise<ParentCoursesSearchParams> | ParentCoursesSearchParams;
}

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("vi-VN");
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}D`;
}

function buildHref(
  state: { q: string; status: ParentCourseStatus; sort: ParentCourseSort; view: ParentCourseView },
  patch: Partial<{ q: string; status: ParentCourseStatus; sort: ParentCourseSort; view: ParentCourseView }>,
) {
  const params = new URLSearchParams();
  const nextQ = patch.q ?? state.q;
  const nextStatus = patch.status ?? state.status;
  const nextSort = patch.sort ?? state.sort;
  const nextView = patch.view ?? state.view;

  if (nextQ.trim()) params.set("q", nextQ.trim());
  if (nextStatus !== "all") params.set("status", nextStatus);
  if (nextSort !== "recent") params.set("sort", nextSort);
  if (nextView !== "grid") params.set("view", nextView);

  const query = params.toString();
  return query ? `/parent/courses?${query}` : "/parent/courses";
}

function parseStatus(raw: string | undefined): ParentCourseStatus {
  if (raw === "learning" || raw === "completed" || raw === "not_started") return raw;
  return "all";
}

function parseSort(raw: string | undefined): ParentCourseSort {
  if (raw === "progress_desc" || raw === "title_asc") return raw;
  return "recent";
}

function parseView(raw: string | undefined): ParentCourseView {
  if (raw === "list") return "list";
  return "grid";
}

export default async function ParentCoursesPage({ searchParams }: ParentCoursesPageProps) {
  const resolvedParams = (searchParams ? await searchParams : {}) as ParentCoursesSearchParams;
  const query = firstString(resolvedParams.q)?.trim() ?? "";
  const status = parseStatus(firstString(resolvedParams.status));
  const sort = parseSort(firstString(resolvedParams.sort));
  const view = parseView(firstString(resolvedParams.view));

  const parent = await requireParent();
  const entitledCourses = await listEntitledCoursesForParent(parent.id);
  const courseIds = entitledCourses.map((row) => row.course.id);

  const [progress, firstChild] = await Promise.all([
    getCourseProgressForParent(parent.id, courseIds),
    prisma.childProfile.findFirst({
      where: { parentId: parent.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);

  const normalizedQuery = query.toLowerCase();

  const rows = entitledCourses.map((item) => {
    const { course, validFrom } = item;
    const pricing = resolveCourseDisplayPricing(course);
    const detailHref = isLegacyBundleRouteSlug(course.slug) ? "/courses" : `/courses/${course.slug}`;
    const prog = progress.get(course.id);
    const completedLessons = prog?.completed ?? 0;
    const totalLessons = course.totalLessons;
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const statusValue: ParentCourseStatus =
      totalLessons > 0 && progressPct >= 100
        ? "completed"
        : completedLessons === 0
          ? "not_started"
          : "learning";

    return {
      course,
      validFrom,
      pricing,
      detailHref,
      completedLessons,
      totalLessons,
      progressPct,
      statusValue,
    };
  });

  const filteredRows = rows.filter((row) => {
    const searchable = `${row.course.title} ${row.course.description}`.toLowerCase();
    if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;
    if (status !== "all" && row.statusValue !== status) return false;
    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sort === "title_asc") {
      return a.course.title.localeCompare(b.course.title, "vi", {
        sensitivity: "base",
      });
    }
    if (sort === "progress_desc") {
      return b.progressPct - a.progressPct;
    }
    return b.validFrom.getTime() - a.validFrom.getTime();
  });

  const totalCourses = rows.length;
  const completedCourses = rows.filter((row) => row.statusValue === "completed").length;
  const learningCourses = rows.filter((row) => row.statusValue === "learning").length;
  const notStartedCourses = rows.filter((row) => row.statusValue === "not_started").length;
  const completionRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  const state = { q: query, status, sort, view };
  const statusOptions: Array<{ key: ParentCourseStatus; label: string; count: number }> = [
    { key: "all", label: "All", count: totalCourses },
    { key: "learning", label: "Studying", count: learningCourses },
    { key: "completed", label: "Completed", count: completedCourses },
    { key: "not_started", label: "Haven't started yet", count: notStartedCourses },
  ];

  return (
    <div className="page-stack">
      <CourseCheckoutStatusBanner />

      <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-[linear-gradient(155deg,#eff6ff_0%,#ffffff_55%,#f0fdf4_100%)] p-5 shadow-sm sm:p-8">
        <div className="grid gap-4">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-3xl">
            <BookOpen className="h-6 w-6 text-sky-600" />
            Manage purchased courses
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Quickly search, filter by status, and change view styles to manage course lists more compactly as the number of courses increases.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Purchased</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalCourses}</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Studying</p>
              <p className="mt-1 text-2xl font-black text-sky-600">{learningCourses}</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Complete</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">{completedCourses}</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Total progress</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{completionRate}%</p>
            </div>
          </div>
        </div>
      </section>

      {entitledCourses.length === 0 ? (
        <section className="card items-center text-center" style={{ padding: "2.25rem 1.25rem" }}>
          <p className="text-lg font-bold text-slate-900">You have not purchased any courses yet</p>
          <p className="max-w-md text-sm leading-relaxed text-slate-600">
            Explore the list of courses according to your child's goals. After successful payment, the lock will open immediately on this page.
          </p>
          <Link href="/courses" className="solid-button" style={{ width: "fit-content" }}>
            See courses available for sale
          </Link>
        </section>
      ) : (
        <>
          <section
            className="sticky z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur sm:p-4"
            style={{ top: "calc(var(--app-nav-height) + 0.8rem)" }}
          >
            <div className="grid gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <form method="get" action="/parent/courses" className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="hidden" name="status" value={status} />
                  <input type="hidden" name="sort" value={sort} />
                  <input type="hidden" name="view" value={view} />
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search by key name or description..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </form>
                <div className="flex flex-wrap gap-1.5">
                  <Link
                    href={buildHref(state, { sort: "recent" })}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      sort === "recent"
                        ? "border-sky-300 bg-sky-50 text-sky-700"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    Just bought
                  </Link>
                  <Link
                    href={buildHref(state, { sort: "progress_desc" })}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      sort === "progress_desc"
                        ? "border-sky-300 bg-sky-50 text-sky-700"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    High progress
                  </Link>
                  <Link
                    href={buildHref(state, { sort: "title_asc" })}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      sort === "title_asc"
                        ? "border-sky-300 bg-sky-50 text-sky-700"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    A-Z
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {statusOptions.map((option) => (
                    <Link
                      key={option.key}
                      href={buildHref(state, { status: option.key })}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        status === option.key
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {option.label} ({option.count})
                    </Link>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={buildHref(state, { view: "grid" })}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      view === "grid"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <Grid3X3 className="h-3.5 w-3.5" /> Grid
                  </Link>
                  <Link
                    href={buildHref(state, { view: "list" })}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      view === "list"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" /> List
                  </Link>
                  {(query || status !== "all" || sort !== "recent") && (
                    <Link href="/parent/courses" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                      Reset
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          {sortedRows.length === 0 ? (
            <section className="card items-center text-center" style={{ padding: "2rem 1.25rem" }}>
              <p className="text-lg font-bold text-slate-900">There is no filter matching lock</p>
              <p className="max-w-md text-sm leading-relaxed text-slate-600">
                Try changing the status, sorting, or search keywords to see the list again.
              </p>
              <Link href="/parent/courses" className="ghost-button" style={{ width: "fit-content" }}>
                Clear filter
              </Link>
            </section>
          ) : view === "grid" ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedRows.map((row) => {
                const { course, validFrom, pricing, detailHref, completedLessons, totalLessons, progressPct, statusValue } = row;
                const continueHref = firstChild
                  ? `/kid/courses/${course.slug}?childId=${firstChild.id}`
                  : `/kid/courses/${course.slug}`;

                return (
                  <article key={course.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex gap-3">
                      {course.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.coverImageUrl}
                          alt={course.title}
                          className="h-20 w-28 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-20 w-28 shrink-0 rounded-xl bg-[linear-gradient(145deg,#e2e8f0_0%,#f8fafc_55%,#ecfeff_100%)]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              statusValue === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : statusValue === "learning"
                                  ? "bg-sky-100 text-sky-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {statusValue === "completed"
                              ? "Completed"
                              : statusValue === "learning"
                                ? "Studying"
                                : "Haven't started yet"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {progressPct}%
                          </span>
                        </div>
                        <h2 className="line-clamp-2 text-sm font-extrabold text-slate-900">{course.title}</h2>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{course.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                        <CalendarDays className="h-3 w-3" /> {formatDate(validFrom)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                        <Clock3 className="h-3 w-3" /> {course.durationDays} days
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                        {completedLessons}/{totalLessons} lessons
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                        Price {formatCurrency(pricing.salePriceVnd)}
                      </span>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Study progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">Access for {course.durationDays} days from purchase</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        href={continueHref}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Continue <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={detailHref}
                        className="inline-flex items-center rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
                      >
                        See key
                      </Link>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <section className="grid gap-3">
              {sortedRows.map((row) => {
                const { course, validFrom, pricing, detailHref, completedLessons, totalLessons, progressPct, statusValue } = row;
                const continueHref = firstChild
                  ? `/kid/courses/${course.slug}?childId=${firstChild.id}`
                  : `/kid/courses/${course.slug}`;

                return (
                  <article
                    key={course.id}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[180px_minmax(0,1fr)_auto]"
                  >
                    <div>
                      {course.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.coverImageUrl}
                          alt={course.title}
                          className="h-24 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-24 w-full rounded-xl bg-[linear-gradient(145deg,#e2e8f0_0%,#f8fafc_55%,#ecfeff_100%)]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            statusValue === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : statusValue === "learning"
                                ? "bg-sky-100 text-sky-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {statusValue === "completed"
                            ? "Completed"
                            : statusValue === "learning"
                              ? "Studying"
                              : "Haven't started yet"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {progressPct}% progress
                        </span>
                      </div>
                      <h2 className="line-clamp-1 text-sm font-extrabold text-slate-900">{course.title}</h2>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{course.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                        <span>Started {formatDate(validFrom)}</span>
                        <span>•</span>
                        <span>{completedLessons}/{totalLessons} lessons</span>
                        <span>•</span>
                        <span>{formatCurrency(pricing.salePriceVnd)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 md:min-w-[140px]">
                      <Link
                        href={continueHref}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Continue <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={detailHref}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
                      >
                        See key
                      </Link>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Buy new courses</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          You can expand your child's learning path at any time. The new categories will keep the quick filtering and comparison experience intact.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/courses" className="solid-button">
            See all courses
          </Link>
          <Link href="/parent/billing" className="ghost-button">
            View payment history
          </Link>
        </div>
      </section>
    </div>
  );
}
