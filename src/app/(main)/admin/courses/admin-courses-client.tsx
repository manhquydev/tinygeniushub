"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";

type CourseRow = {
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
  createdAt: Date;
  _count: { enrollments: number; lessons: number };
};

type FormState = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  listPriceVnd: string;
  salePriceVnd: string;
  saleStartsAt: string;
  saleEndsAt: string;
  durationDays: string;
  coverImageUrl: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  title: "",
  description: "",
  listPriceVnd: "299000",
  salePriceVnd: "",
  saleStartsAt: "",
  saleEndsAt: "",
  durationDays: "30",
  coverImageUrl: "",
};

function formatVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function getPublishStatusLabel(isPublished: boolean) {
  return isPublished ? "Đã xuất bản" : "Bản nháp";
}

function getSaleStatusLabel(status: string) {
  if (status === "active") return "Khuyến mãi đang chạy";
  if (status === "scheduled") return "Khuyến mãi sắp mở";
  if (status === "expired") return "Khuyến mãi đã hết hạn";
  if (status === "invalid") return "Sale không hợp lệ";
  return "Không có khuyến mãi";
}

function toDatetimeLocalInputValue(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoOrNull(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

function parseApiError(json: unknown, fallback: string) {
  if (json && typeof json === "object") {
    const payload = json as {
      error?: { message?: string };
      message?: string;
    };
    if (payload.error?.message) return payload.error.message;
    if (payload.message) return payload.message;
  }
  return fallback;
}

export function AdminCoursesClient({ initialCourses }: { initialCourses: CourseRow[] }) {
  const [courses, setCourses] = useState<CourseRow[]>(initialCourses);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))),
    [courses],
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(course: CourseRow) {
    setForm({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      listPriceVnd: String(course.listPriceVnd ?? course.priceVnd),
      salePriceVnd: course.salePriceVnd === null || course.salePriceVnd === undefined ? "" : String(course.salePriceVnd),
      saleStartsAt: toDatetimeLocalInputValue(course.saleStartsAt),
      saleEndsAt: toDatetimeLocalInputValue(course.saleEndsAt),
      durationDays: String(course.durationDays),
      coverImageUrl: course.coverImageUrl ?? "",
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const listPriceVnd = Number(form.listPriceVnd);
      const salePriceCandidate = form.salePriceVnd.trim() ? Number(form.salePriceVnd) : null;
      const saleStartsAt = toIsoOrNull(form.saleStartsAt);
      const saleEndsAt = toIsoOrNull(form.saleEndsAt);

      if (!form.slug.trim() || !form.title.trim()) {
        throw new Error("Slug và tiêu đề là bắt buộc");
      }

      if (!Number.isFinite(listPriceVnd) || listPriceVnd < 0) {
        throw new Error("Giá gốc không hợp lệ");
      }

      if (salePriceCandidate !== null) {
        if (!Number.isFinite(salePriceCandidate) || salePriceCandidate < 0) {
          throw new Error("Giá khuyến mãi không hợp lệ");
        }
        if (salePriceCandidate >= listPriceVnd) {
          throw new Error("Giá khuyến mãi phải nhỏ hơn giá gốc");
        }
        if (Boolean(saleStartsAt) !== Boolean(saleEndsAt)) {
          throw new Error("Cần nhập đầy đủ thời gian bắt đầu và kết thúc khuyến mãi");
        }
        if (saleStartsAt && saleEndsAt && new Date(saleStartsAt) >= new Date(saleEndsAt)) {
          throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
      } else if (saleStartsAt || saleEndsAt) {
        throw new Error("Cần đặt giá khuyến mãi trước khi đặt thời gian");
      }

      const payload = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        priceVnd: listPriceVnd,
        listPriceVnd,
        salePriceVnd: salePriceCandidate,
        saleStartsAt,
        saleEndsAt,
        durationDays: Number(form.durationDays),
        coverImageUrl: form.coverImageUrl.trim() || null,
      };

      const endpoint = form.id ? `/api/admin/courses/${form.id}` : "/api/admin/courses";
      const method = form.id ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as {
        ok?: boolean;
        data?: { course: CourseRow };
        error?: { message?: string };
      };

      if (!json.ok || !json.data?.course) {
        throw new Error(parseApiError(json, "Không thể lưu khóa học"));
      }

      if (form.id) {
        setCourses((prev) =>
          prev.map((course) =>
            course.id === form.id
              ? {
                  ...json.data!.course,
                  _count: course._count,
                }
              : course,
          ),
        );
      } else {
        setCourses((prev) => [{ ...json.data!.course, _count: { enrollments: 0, lessons: 0 } }, ...prev]);
      }

      setShowForm(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(course: CourseRow) {
    const response = await fetch(`/api/admin/courses/${course.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !course.isPublished }),
    });
    const json = (await response.json()) as { ok?: boolean; data?: { course: CourseRow } };
    if (!json.ok || !json.data?.course) return;

    setCourses((prev) => prev.map((item) => (item.id === course.id ? { ...item, isPublished: json.data!.course.isPublished } : item)));
  }

  async function handleDelete(course: CourseRow) {
    if (!confirm(`Xóa khóa học \"${course.title}\"?`)) return;
    const response = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
    const json = (await response.json()) as { ok?: boolean };
    if (!json.ok) return;
    setCourses((prev) => prev.filter((item) => item.id !== course.id));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.02em] text-[var(--admin-text-primary)]">Khóa học Premium</h1>
            <p className="mt-2 text-sm text-[var(--admin-text-secondary)]">Quản lý giá, thời gian khuyến mãi và trạng thái công khai.</p>
          </div>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50" onClick={openCreate}>
            Tạo khóa học
          </button>
        </div>
      </section>

      {showForm ? (
        <section className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-black text-[var(--admin-text-primary)]">{form.id ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--admin-text-secondary)]">Slug *<input className="min-h-10 rounded-xl border border-[var(--admin-card-border)] px-3 text-sm font-normal" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--admin-text-secondary)]">Tiêu đề *<input className="min-h-10 rounded-xl border border-[var(--admin-card-border)] px-3 text-sm font-normal" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--admin-text-secondary)] md:col-span-2">Mô tả<textarea className="min-h-20 rounded-xl border border-[var(--admin-card-border)] px-3 py-2 text-sm font-normal" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--admin-text-secondary)]">Giá gốc (VND)<input type="number" className="min-h-10 rounded-xl border border-[var(--admin-card-border)] px-3 text-sm font-normal" value={form.listPriceVnd} onChange={(event) => setForm((current) => ({ ...current, listPriceVnd: event.target.value }))} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--admin-text-secondary)]">Giá khuyến mãi (VND)<input type="number" className="min-h-10 rounded-xl border border-[var(--admin-card-border)] px-3 text-sm font-normal" value={form.salePriceVnd} onChange={(event) => setForm((current) => ({ ...current, salePriceVnd: event.target.value }))} placeholder="để trống nếu không sale, nhập 0 để mở miễn phí tạm thời" /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--admin-text-secondary)]">Bắt đầu sale<input type="datetime-local" className="min-h-10 rounded-xl border border-[var(--admin-card-border)] px-3 text-sm font-normal" value={form.saleStartsAt} onChange={(event) => setForm((current) => ({ ...current, saleStartsAt: event.target.value }))} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--admin-text-secondary)]">Kết thúc sale<input type="datetime-local" className="min-h-10 rounded-xl border border-[var(--admin-card-border)] px-3 text-sm font-normal" value={form.saleEndsAt} onChange={(event) => setForm((current) => ({ ...current, saleEndsAt: event.target.value }))} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--admin-text-secondary)]">Thời lượng (ngày)<input type="number" className="min-h-10 rounded-xl border border-[var(--admin-card-border)] px-3 text-sm font-normal" value={form.durationDays} onChange={(event) => setForm((current) => ({ ...current, durationDays: event.target.value }))} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--admin-text-secondary)] md:col-span-2">URL ảnh bìa<input className="min-h-10 rounded-xl border border-[var(--admin-card-border)] px-3 text-sm font-normal" value={form.coverImageUrl} onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))} /></label>
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="mt-4 flex gap-3">
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50" onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-4 py-2 text-sm font-semibold text-[var(--admin-text-secondary)] hover:bg-[var(--admin-sidebar-accent)] disabled:opacity-50" onClick={() => setShowForm(false)}>Hủy</button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--admin-sidebar-accent)] text-xs uppercase tracking-[0.12em] text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Giá hiển thị</th>
                <th className="px-4 py-3">Trạng thái sale</th>
                <th className="px-4 py-3">Bài học</th>
                <th className="px-4 py-3">Học viên</th>
                <th className="px-4 py-3">Công khai</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sortedCourses.map((course) => {
                const pricing = resolveCourseDisplayPricing(course);
                return (
                  <tr key={course.id} className="border-t border-[var(--admin-card-border)]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--admin-text-primary)]">{course.title}</div>
                      <div className="text-xs text-[var(--admin-text-muted)]">{course.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--admin-text-secondary)]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--admin-text-primary)]">{formatVnd(pricing.salePriceVnd)}</span>
                        {pricing.hasDiscount ? <span className="text-xs text-[var(--admin-text-muted)] line-through">{formatVnd(pricing.listPriceVnd)}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--admin-text-secondary)]">{getSaleStatusLabel(pricing.saleStatus)}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{course._count.lessons}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{course._count.enrollments}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${course.isPublished ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] text-[var(--admin-text-secondary)]"}`}>{getPublishStatusLabel(course.isPublished)}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button type="button" className="text-sm font-semibold text-teal-700 hover:text-teal-800" onClick={() => openEdit(course)}>Sửa</button>
                        <button type="button" className="text-sm font-semibold text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]" onClick={() => handleTogglePublish(course)}>{course.isPublished ? "Ẩn" : "Xuất bản"}</button>
                        <a href={`/courses/${course.slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]">Xem</a>
                        <Link href={`/admin/courses/${course.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Quản lý</Link>
                        <button type="button" className="text-sm font-semibold text-red-600 hover:text-red-800" onClick={() => handleDelete(course)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--admin-text-muted)]">Chưa có khóa học nào.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
