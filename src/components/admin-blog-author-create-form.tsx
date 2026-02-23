"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import slugify from "slugify";

export function AdminBlogAuthorCreateForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/blog/authors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: slugify(displayName, {
            lower: true,
            locale: "vi",
            strict: true,
          }),
          displayName: displayName.trim(),
          role: role.trim(),
          email: email.trim() || undefined,
          bio: bio.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("CREATE_FAILED");
      }

      setDisplayName("");
      setRole("");
      setEmail("");
      setBio("");
      router.refresh();
    } catch {
      setError("Không thể tạo tác giả.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
      <input
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="Tên hiển thị"
        required
        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"
      />
      <input
        value={role}
        onChange={(event) => setRole(event.target.value)}
        placeholder="Vai trò"
        required
        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"
      />
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"
      />
      <input
        value={bio}
        onChange={(event) => setBio(event.target.value)}
        placeholder="Giới thiệu"
        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"
      />
      <button type="submit" disabled={submitting} className="solid-button sm:col-span-2">
        {submitting ? "Đang tạo..." : "Tạo tác giả"}
      </button>

      {error ? <p className="text-sm font-semibold text-rose-700 sm:col-span-2">{error}</p> : null}
    </form>
  );
}
