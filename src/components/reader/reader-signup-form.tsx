"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

type ReaderSignupFormProps = {
  nextPath?: string | null;
};

export function ReaderSignupForm({ nextPath }: ReaderSignupFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const safeNextPath = sanitizeNextPath(nextPath) ?? "/blog";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/reader/auth/signup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
        }),
      });

      const body = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể đăng ký.");
        return;
      }

      router.push(safeNextPath);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể đăng ký.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h1 className="text-2xl font-black tracking-[-0.02em] text-slate-900">
        Đăng ký độc giả
      </h1>
      <p className="text-sm text-slate-600">
        Tạo tài khoản để lưu bài viết và theo dõi cập nhật mới.
      </p>

      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Tên hiển thị
        <input
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </label>

      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Email
        <input
          type="email"
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Mật khẩu
        <input
          type="password"
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-full bg-teal-600 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
      >
        {loading ? "Đang đăng ký..." : "Đăng ký"}
      </button>

      <p className="text-sm text-slate-600">
        Đã có tài khoản?{" "}
        <Link
          href={`/reader/login${safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : ""}`}
          className="font-bold text-teal-700 hover:text-teal-800"
        >
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
