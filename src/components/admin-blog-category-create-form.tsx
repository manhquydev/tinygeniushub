"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdminBlogCategoryCreateForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [nameVi, setNameVi] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState("#10b981");
  const [description, setDescription] = useState("");
  const [orderNo, setOrderNo] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: slug.trim(),
          nameVi: nameVi.trim(),
          emoji: emoji.trim() || undefined,
          color: color.trim() || undefined,
          description: description.trim() || undefined,
          orderNo: Number(orderNo) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error("CREATE_FAILED");
      }

      setSlug("");
      setNameVi("");
      setEmoji("");
      setColor("#10b981");
      setDescription("");
      setOrderNo("0");
      router.refresh();
    } catch {
      setError("Không thể tạo danh mục.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
      <input
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        placeholder="slug"
        required
        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"
      />
      <input
        value={nameVi}
        onChange={(event) => setNameVi(event.target.value)}
        placeholder="Tên danh mục"
        required
        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"
      />
      <input
        value={emoji}
        onChange={(event) => setEmoji(event.target.value)}
        placeholder="Emoji"
        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"
      />
      <input
        value={color}
        onChange={(event) => setColor(event.target.value)}
        placeholder="#10b981"
        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"
      />
      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Mô tả"
        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm sm:col-span-2"
      />
      <input
        type="number"
        value={orderNo}
        onChange={(event) => setOrderNo(event.target.value)}
        placeholder="Thứ tự"
        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"
      />
      <button type="submit" disabled={submitting} className="solid-button sm:col-span-1">
        {submitting ? "Đang tạo..." : "Tạo danh mục"}
      </button>

      {error ? <p className="text-sm font-semibold text-rose-700 sm:col-span-2">{error}</p> : null}
    </form>
  );
}
