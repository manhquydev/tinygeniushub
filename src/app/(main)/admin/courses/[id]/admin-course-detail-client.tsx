"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, Search, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";

// ---- Types ----
type CourseLessonItem = {
  id: string;
  courseId: string;
  lessonId: string;
  orderNo: number;
  lesson: {
    id: string;
    slug: string;
    title: string;
    estimatedMinutes: number;
    trialEnabled: boolean;
    videoStatus: string;
    _count: { activities: number };
  };
};

type LessonSearchResult = {
  id: string;
  slug: string;
  title: string;
  estimatedMinutes: number;
  trialEnabled: boolean;
  videoStatus: string;
  unit: {
    title: string;
    level: { title: string; track: { code: string } };
  };
  _count: { activities: number };
};

type EnrollmentRow = {
  id: string;
  parentId: string;
  enrolledAt: string;
  completedAt: string | null;
  parent: { email: string; displayName: string | null };
};

type CourseDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceVnd: number;
  listPriceVnd?: number | null;
  salePriceVnd?: number | null;
  saleStartsAt?: string | Date | null;
  saleEndsAt?: string | Date | null;
  durationDays: number;
  isPublished: boolean;
  coverImageUrl: string | null;
  _count: { enrollments: number };
  lessons: CourseLessonItem[];
};

type Tab = "lessons" | "enrollments";

// ---- Helpers ----
function trackLabel(code: string) {
  if (code === "ENGLISH") return "English";
  if (code === "MATH") return "Maths";
  if (code === "HABIT") return "Habit";
  return code;
}

function getVideoStatusLabel(status: string) {
  if (status === "ready") return "Ready";
  if (status === "processing") return "Processing";
  if (status === "none") return "No videos yet";
  return status;
}

function getPublishStatusLabel(isPublished: boolean) {
  return isPublished ? "Published" : "Draft";
}

function getSaleStatusLabel(status: string) {
  if (status === "active") return "Promotion is running";
  if (status === "scheduled") return "Promotion is about to open";
  if (status === "expired") return "Promotion has expired";
  if (status === "invalid") return "Promotion is not valid";
  return "There are no promotions";
}

function VideoStatusBadge({ status }: { status: string }) {
  if (status === "ready") {
    return (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        {getVideoStatusLabel(status)}
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
        {getVideoStatusLabel(status)}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] px-2 py-0.5 text-xs font-semibold text-[var(--admin-text-muted)]">
      {getVideoStatusLabel(status)}
    </span>
  );
}

// ---- Main Component ----
export function AdminCourseDetailClient({ course: initialCourse }: { course: CourseDetail }) {
  const [course, setCourse] = useState<CourseDetail>(initialCourse);
  const [tab, setTab] = useState<Tab>("lessons");
  const [lessons, setLessons] = useState<CourseLessonItem[]>(initialCourse.lessons);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [enrollmentsLoaded, setEnrollmentsLoaded] = useState(false);

  // Lesson picker
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerResults, setPickerResults] = useState<LessonSearchResult[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saving state
  const [removing, setRemoving] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  // Load enrollments
  const loadEnrollments = useCallback(async () => {
    if (enrollmentsLoaded) return;
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/enrollments`);
      const json = (await res.json()) as { ok?: boolean; data?: { enrollments: EnrollmentRow[] } };
      if (json.ok && json.data) {
        setEnrollments(json.data.enrollments);
        setEnrollmentsLoaded(true);
      }
    } catch {
      // silent
    }
  }, [course.id, enrollmentsLoaded]);

  useEffect(() => {
    if (tab === "enrollments") loadEnrollments();
  }, [tab, loadEnrollments]);

  // Lesson search
  useEffect(() => {
    if (!showPicker) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setPickerLoading(true);
      try {
        const url = `/api/admin/lessons?search=${encodeURIComponent(pickerSearch)}&excludeCourseId=${course.id}&limit=30`;
        const res = await fetch(url);
        const json = (await res.json()) as { ok?: boolean; data?: { lessons: LessonSearchResult[] } };
        if (json.ok && json.data) setPickerResults(json.data.lessons);
      } finally {
        setPickerLoading(false);
      }
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [pickerSearch, showPicker, course.id]);

  async function handleAddLesson(lesson: LessonSearchResult) {
    setAdding(lesson.id);
    try {
      const nextOrderNo = lessons.length + 1;
      const res = await fetch(`/api/admin/courses/${course.id}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, orderNo: nextOrderNo }),
      });
      const json = (await res.json()) as { ok?: boolean; data?: { courseLesson: CourseLessonItem } };
      if (!json.ok) return;
      const newItem: CourseLessonItem = {
        id: json.data!.courseLesson.id,
        courseId: course.id,
        lessonId: lesson.id,
        orderNo: nextOrderNo,
        lesson: {
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          estimatedMinutes: lesson.estimatedMinutes,
          trialEnabled: lesson.trialEnabled,
          videoStatus: lesson.videoStatus,
          _count: lesson._count,
        },
      };
      setLessons((prev) => [...prev, newItem]);
      // Remove from picker results
      setPickerResults((prev) => prev.filter((l) => l.id !== lesson.id));
    } finally {
      setAdding(null);
    }
  }

  async function handleRemoveLesson(item: CourseLessonItem) {
    if (!confirm(`Delete "${item.lesson.title}" from the course?`)) return;
    setRemoving(item.lessonId);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/lessons`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: item.lessonId }),
      });
      const json = (await res.json()) as { ok?: boolean };
      if (!json.ok) return;
      const updated = lessons
        .filter((l) => l.lessonId !== item.lessonId)
        .map((l, idx) => ({ ...l, orderNo: idx + 1 }));
      setLessons(updated);
      // Re-sync orderNos in DB
      if (updated.length > 0) {
        void fetch(`/api/admin/courses/${course.id}/lessons`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orders: updated.map((l) => ({ lessonId: l.lessonId, orderNo: l.orderNo })),
          }),
        });
      }
    } finally {
      setRemoving(null);
    }
  }

  async function handleMoveLesson(index: number, direction: "up" | "down") {
    const newLessons = [...lessons];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newLessons.length) return;
    [newLessons[index], newLessons[swapIndex]] = [newLessons[swapIndex], newLessons[index]];
    const reordered = newLessons.map((l, idx) => ({ ...l, orderNo: idx + 1 }));
    setLessons(reordered);
    await fetch(`/api/admin/courses/${course.id}/lessons`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orders: reordered.map((l) => ({ lessonId: l.lessonId, orderNo: l.orderNo })),
      }),
    });
  }

  async function handleTogglePublish() {
    const res = await fetch(`/api/admin/courses/${course.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !course.isPublished }),
    });
    const json = (await res.json()) as { ok?: boolean; data?: { course: { isPublished: boolean } } };
    if (json.ok && json.data) {
      setCourse((prev) => ({ ...prev, isPublished: json.data!.course.isPublished }));
    }
  }

  const totalMinutes = lessons.reduce((sum, l) => sum + l.lesson.estimatedMinutes, 0);
  const pricing = resolveCourseDisplayPricing(course);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
        <div className="mb-4">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"
          >
            <ArrowLeft size={14} />
            Course
          </Link>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.02em] text-[var(--admin-text-primary)]">{course.title}</h1>
            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{course.slug}</p>
            <p className="mt-2 text-sm text-[var(--admin-text-secondary)]">{course.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right text-sm text-[var(--admin-text-secondary)]">
              <div>
                <span className="font-semibold">{new Intl.NumberFormat("vi-VN").format(pricing.salePriceVnd)} VND</span>
                {pricing.hasDiscount ? (
                  <span className="ml-2 text-xs text-[var(--admin-text-muted)] line-through">
                    {new Intl.NumberFormat("vi-VN").format(pricing.listPriceVnd)} VND
                  </span>
                ) : null}
              </div>
              <div>{course.durationDays} days</div>
              <div className="text-xs text-[var(--admin-text-muted)]">{getSaleStatusLabel(pricing.saleStatus)}</div>
            </div>
            <button
              type="button"
              onClick={handleTogglePublish}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                course.isPublished
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {course.isPublished ? "Hide course" : "Publish"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--admin-sidebar-accent)] px-3 py-1.5 text-sm">
            <BookOpen size={14} className="text-[var(--admin-text-muted)]" />
            <span className="font-semibold text-[var(--admin-text-secondary)]">{lessons.length}</span>
            <span className="text-[var(--admin-text-muted)]">lesson</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--admin-sidebar-accent)] px-3 py-1.5 text-sm">
            <span className="font-semibold text-[var(--admin-text-secondary)]">{totalMinutes}</span>
            <span className="text-[var(--admin-text-muted)]">study minutes</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--admin-sidebar-accent)] px-3 py-1.5 text-sm">
            <Users size={14} className="text-[var(--admin-text-muted)]" />
            <span className="font-semibold text-[var(--admin-text-secondary)]">{course._count.enrollments}</span>
            <span className="text-[var(--admin-text-muted)]">student</span>
          </div>
          <span
            className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-semibold ${
              course.isPublished
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] text-[var(--admin-text-secondary)]"
            }`}
          >
            {getPublishStatusLabel(course.isPublished)}
          </span>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-1 shadow-sm">
        {(["lessons", "enrollments"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-slate-900 text-white"
                : "text-[var(--admin-text-secondary)] hover:bg-[var(--admin-sidebar-accent)] hover:text-[var(--admin-text-primary)]"
            }`}
          >
            {t === "lessons" ? `Lesson (${lessons.length})` : `Students (${course._count.enrollments})`}
          </button>
        ))}
      </div>

      {/* Lessons Tab */}
      {tab === "lessons" ? (
        <section className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <h2 className="text-lg font-black text-[var(--admin-text-primary)]">List of lessons</h2>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              onClick={() => {
                setPickerSearch("");
                setPickerResults([]);
                setShowPicker(true);
              }}
            >
              <Plus size={15} />
              More lessons
            </button>
          </div>

          {/* Lesson Picker */}
          {showPicker ? (
            <div className="mb-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-indigo-800">Find and add lessons from the library</p>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="text-sm font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"
                >
                  Close
                </button>
              </div>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
                <input
                  autoFocus
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search lessons by name or slug…"
                  className="w-full rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] py-2 pl-8 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {pickerLoading ? (
                  <p className="py-4 text-center text-xs text-[var(--admin-text-muted)]">Loading…</p>
                ) : pickerResults.length === 0 ? (
                  <p className="py-4 text-center text-xs text-[var(--admin-text-muted)]">
                    {pickerSearch ? "No lessons found." : "Enter to find lessons."}
                  </p>
                ) : (
                  pickerResults.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--admin-text-primary)]">{lesson.title}</p>
                        <p className="text-xs text-[var(--admin-text-muted)]">
                          {trackLabel(lesson.unit.level.track.code)} › {lesson.unit.level.title} › {lesson.unit.title}
                          {" · "}
                          {lesson.estimatedMinutes}p · {lesson._count.activities} questions
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={adding === lesson.id}
                        onClick={() => handleAddLesson(lesson)}
                        className="ml-3 shrink-0 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        {adding === lesson.id ? "Adding…" : "More"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {/* Lessons List */}
          {lessons.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--admin-card-border)] py-12 text-center">
              <BookOpen size={32} className="mx-auto mb-3 text-[var(--admin-text-muted)]" />
              <p className="text-sm font-semibold text-[var(--admin-text-muted)]">There are no lessons yet.</p>
              <p className="mt-1 text-xs text-[var(--admin-text-muted)]">Click "Add lesson" to assign lessons from the library.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] px-4 py-3"
                >
                  <span className="w-6 shrink-0 text-center text-xs font-black text-[var(--admin-text-muted)]">{item.orderNo}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--admin-text-primary)]">{item.lesson.title}</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">
                      {item.lesson.slug} · {item.lesson.estimatedMinutes}p · {item.lesson._count.activities} questions
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <VideoStatusBadge status={item.lesson.videoStatus} />
                    {item.lesson.trialEnabled ? (
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        Try it out
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveLesson(index, "up")}
                      className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-slate-200 hover:text-[var(--admin-text-secondary)] disabled:opacity-30"
                      title="Go up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === lessons.length - 1}
                      onClick={() => handleMoveLesson(index, "down")}
                      className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-slate-200 hover:text-[var(--admin-text-secondary)] disabled:opacity-30"
                      title="Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={removing === item.lessonId}
                      onClick={() => handleRemoveLesson(item)}
                      className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
                      title="Removed from course"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* Enrollments Tab */}
      {tab === "enrollments" ? (
        <section className="overflow-hidden rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--admin-sidebar-accent)] text-xs uppercase tracking-[0.12em] text-[var(--admin-text-muted)]">
                <tr>
                  <th className="px-4 py-3">Parent email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Registration date</th>
                  <th className="px-4 py-3">Complete</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} className="border-t border-[var(--admin-card-border)]">
                    <td className="px-4 py-3 font-medium text-[var(--admin-text-primary)]">{e.parent.email}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{e.parent.displayName ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-secondary)]">
                      {new Date(e.enrolledAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      {e.completedAt ? (
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {new Date(e.completedAt).toLocaleDateString("vi-VN")}
                        </span>
                      ) : (
                        <span className="text-[var(--admin-text-muted)]">Unfinished</span>
                      )}
                    </td>
                  </tr>
                ))}
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--admin-text-muted)]">
                      There are no students registered for this course.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
