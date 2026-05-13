"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      setError("Unable to create category.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 sm:grid-cols-2">
      <Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="slug" required />
      <Input value={nameVi} onChange={(event) => setNameVi(event.target.value)} placeholder="Category name" required />
      <Input value={emoji} onChange={(event) => setEmoji(event.target.value)} placeholder="Emoji" />
      <Input value={color} onChange={(event) => setColor(event.target.value)} placeholder="#10b981" />
      <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe" className="sm:col-span-2" />
      <Input type="number" value={orderNo} onChange={(event) => setOrderNo(event.target.value)} placeholder="Order" />
      <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
        {submitting ? "Creating..." : "Create categories"}
      </Button>
      {error ? <p className="text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
    </form>
  );
}
