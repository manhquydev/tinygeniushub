"use client";

import { useState } from "react";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceVnd: number;
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
  priceVnd: string;
  durationDays: string;
  coverImageUrl: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  title: "",
  description: "",
  priceVnd: "299000",
  durationDays: "30",
  coverImageUrl: "",
};

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
    setForm({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      priceVnd: String(course.priceVnd),
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
      const payload = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        priceVnd: Number(form.priceVnd),
        durationDays: Number(form.durationDays),
        coverImageUrl: form.coverImageUrl.trim() || null,
      };

      if (!payload.slug || !payload.title) {
        setError("Slug và tiêu đề là bắt buộc.");
        return;
      }

      if (form.id) {
        const res = await fetch(`/api/admin/courses/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { ok?: boolean; data?: { course: CourseRow }; error?: string };
        if (!json.ok) throw new Error(json.error ?? "Lưu thất bại");
        setCourses((prev) =>
          prev.map((c) =>
            c.id === form.id ? { ...c, ...json.data!.course, _count: c._count } : c,
          ),
        );
      } else {
        const res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { ok?: boolean; data?: { course: CourseRow }; error?: string };
        if (!json.ok) throw new Error(json.error ?? "Tạo thất bại");
        const newCourse = { ...json.data!.course, _count: { enrollments: 0, lessons: 0 } };
        setCourses((prev) => [newCourse, ...prev]);
      }

      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
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
      if (!json.ok) return;
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, isPublished: json.data!.course.isPublished } : c)),
      );
    } catch {
      // silent
    }
  }

  async function handleDelete(course: CourseRow) {
    if (!confirm(`Xoá khoá học "${course.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok?: boolean };
      if (!json.ok) return;
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch {
      // silent
    }
  }

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="section-header">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Khoá học Premium</h1>
            <p className="mt-2 text-sm text-slate-600">Tạo và quản lý khoá học bán lẻ.</p>
          </div>
          <button type="button" className="solid-button" onClick={openCreate}>
            Tạo khoá học
          </button>
        </div>
      </section>

      {showForm ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-black text-slate-900">{form.id ? "Chỉnh sửa khoá học" : "Tạo khoá học mới"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Slug *
              <input
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="toan-tu-duy-co-ban"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Tiêu đề *
              <input
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Toán Tư Duy Cơ Bản"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
              Mô tả
              <textarea
                className="min-h-20 rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả khoá học..."
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Giá (VNĐ)
              <input
                type="number"
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.priceVnd}
                onChange={(e) => setForm((f) => ({ ...f, priceVnd: e.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Thời lượng (ngày)
              <input
                type="number"
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.durationDays}
                onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
              Cover image URL
              <input
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-normal"
                value={form.coverImageUrl}
                onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </label>
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="mt-4 flex gap-3">
            <button type="button" className="solid-button" onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </button>
            <button type="button" className="ghost-button" onClick={cancelForm}>
              Huỷ
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
              {courses.map((course) => (
                <tr key={course.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{course.title}</div>
                    <div className="text-xs text-slate-500">{course.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {new Intl.NumberFormat("vi-VN").format(course.priceVnd)}đ
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
                      {course.isPublished ? "Published" : "Draft"}
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
                      <button
                        type="button"
                        className="text-sm font-semibold text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(course)}
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    Chưa có khoá học nào. Nhấn &quot;Tạo khoá học&quot; để bắt đầu.
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
