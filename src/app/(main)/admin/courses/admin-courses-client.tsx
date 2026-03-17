"use client";

import Link from "next/link";
import { useState } from "react";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceVnd: number;
  listPriceVnd?: number | null;
  salePriceVnd?: number | null;
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
  durationDays: string;
  coverImageUrl: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  title: "",
  description: "",
  listPriceVnd: "299000",
  salePriceVnd: "299000",
  durationDays: "30",
  coverImageUrl: "",
};

function formatVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}₫`;
}

function getPublishStatusLabel(isPublished: boolean) {
  return isPublished ? "Đã xuất bản" : "Bản nháp";
}

export function AdminCoursesClient({ initialCourses }: { initialCourses: CourseRow[] }) {
  const [courses, setCourses] = useState<CourseRow[]>(initialCourses);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(course: CourseRow) {
    const currentSalePrice = course.salePriceVnd ?? course.priceVnd;
    const currentListPrice = course.listPriceVnd ?? course.priceVnd;

    setForm({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      listPriceVnd: String(currentListPrice),
      salePriceVnd: String(currentSalePrice),
      durationDays: String(course.durationDays),
      coverImageUrl: course.coverImageUrl ?? "",
    });
    setError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const listPriceVnd = Number(form.listPriceVnd);
      const salePriceVnd = Number(form.salePriceVnd);

      const payload = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        priceVnd: salePriceVnd,
        listPriceVnd,
        salePriceVnd,
        durationDays: Number(form.durationDays),
        coverImageUrl: form.coverImageUrl.trim() || null,
      };

      if (!payload.slug || !payload.title) {
        setError("Slug và tiêu đề là bắt buộc.");
        return;
      }

      if (!Number.isFinite(listPriceVnd) || !Number.isFinite(salePriceVnd)) {
        setError("Giá gốc và giá bán phải là số hợp lệ.");
        return;
      }

      if (listPriceVnd < salePriceVnd) {
        setError("Giá gốc phải lớn hơn hoặc bằng giá bán.");
        return;
      }

      if (form.id) {
        const res = await fetch(`/api/admin/courses/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { ok?: boolean; data?: { course: CourseRow }; error?: string };
        if (!json.ok || !json.data?.course) throw new Error(json.error ?? "Lưu thất bại");

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
        const res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { ok?: boolean; data?: { course: CourseRow }; error?: string };
        if (!json.ok || !json.data?.course) throw new Error(json.error ?? "Tạo thất bại");

        const newCourse = {
          ...json.data.course,
          _count: { enrollments: 0, lessons: 0 },
        };

        setCourses((prev) => [newCourse, ...prev]);
      }

      setShowForm(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(course: CourseRow) {
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });
      const json = (await res.json()) as { ok?: boolean; data?: { course: CourseRow } };
      if (!json.ok || !json.data?.course) return;

      setCourses((prev) =>
        prev.map((item) =>
          item.id === course.id
            ? {
                ...item,
                isPublished: json.data!.course.isPublished,
              }
            : item,
        ),
      );
    } catch {
      // no-op
    }
  }

  async function handleDelete(course: CourseRow) {
    if (!confirm(`Xóa khóa học "${course.title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok?: boolean };
      if (!json.ok) return;

      setCourses((prev) => prev.filter((item) => item.id !== course.id));
    } catch {
      // no-op
    }
  }

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="section-header">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Khóa học Premium</h1>
            <p className="mt-2 text-sm text-slate-600">Tạo và quản lý khóa học bán lẻ.</p>
          </div>
          <button type="button" className="solid-button" onClick={openCreate}>
            Tạo khóa học
          </button>
        </div>
      </section>

      {showForm ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-black text-slate-900">{form.id ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Slug *
              <input
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder="toan-tu-duy-co-ban"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Tiêu đề *
              <input
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Toán Tư Duy Cơ Bản"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
              Mô tả
              <textarea
                className="min-h-20 rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Mô tả khóa học..."
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Giá gốc (VNĐ)
              <input
                type="number"
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.listPriceVnd}
                onChange={(event) => setForm((current) => ({ ...current, listPriceVnd: event.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Giá bán (VNĐ)
              <input
                type="number"
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.salePriceVnd}
                onChange={(event) => setForm((current) => ({ ...current, salePriceVnd: event.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Thời lượng (ngày)
              <input
                type="number"
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.durationDays}
                onChange={(event) => setForm((current) => ({ ...current, durationDays: event.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
              URL ảnh bìa
              <input
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.coverImageUrl}
                onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))}
                placeholder="https://... hoặc /images/..."
              />
              <span className="text-xs font-normal text-slate-500">
                Hỗ trợ URL đầy đủ hoặc đường dẫn nội bộ bắt đầu bằng `/`.
              </span>
            </label>
            {form.coverImageUrl.trim() ? (
              <div className="md:col-span-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.coverImageUrl.trim()}
                  alt="Xem trước ảnh bìa"
                  className="h-32 w-full rounded-xl border border-slate-200 object-cover"
                />
              </div>
            ) : null}
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="mt-4 flex gap-3">
            <button type="button" className="solid-button" onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button type="button" className="ghost-button" onClick={cancelForm}>
              Hủy
            </button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Bài học</th>
                <th className="px-4 py-3">Học viên</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const salePrice = course.salePriceVnd ?? course.priceVnd;
                const listPrice = course.listPriceVnd ?? course.priceVnd;
                const hasDiscount = listPrice > salePrice;

                return (
                  <tr key={course.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{course.title}</div>
                      <div className="text-xs text-slate-500">{course.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{formatVnd(salePrice)}</span>
                        {hasDiscount ? <span className="text-xs text-slate-500 line-through">{formatVnd(listPrice)}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{course._count.lessons}</td>
                    <td className="px-4 py-3 text-slate-700">{course._count.enrollments}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
                          course.isPublished
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getPublishStatusLabel(course.isPublished)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                          onClick={() => openEdit(course)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                          onClick={() => handleTogglePublish(course)}
                        >
                          {course.isPublished ? "Ẩn" : "Xuất bản"}
                        </button>
                        <a
                          href={`/courses/${course.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Xem
                        </a>
                        <Link href={`/admin/courses/${course.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                          Quản lý
                        </Link>
                        <button
                          type="button"
                          className="text-sm font-semibold text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(course)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    Chưa có khóa học nào. Nhấn "Tạo khóa học" để bắt đầu.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

