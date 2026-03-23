"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

type ReaderLoginFormProps = {
  nextPath?: string | null;
};

export function ReaderLoginForm({ nextPath }: ReaderLoginFormProps) {
  const router = useRouter();
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
      const response = await fetch("/api/reader/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const body = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể đăng nhập.");
        return;
      }

      router.push(safeNextPath);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể đăng nhập.");
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
        Đăng nhập độc giả
      </h1>
      <p className="text-sm text-slate-600">
        Lưu bài viết yêu thích và nhận thông báo khi có nội dung mới.
      </p>

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
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      <p className="text-sm text-slate-600">
        Chưa có tài khoản?{" "}
        <Link
          href={`/reader/signup${safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : ""}`}
          className="font-bold text-teal-700 hover:text-teal-800"
        >
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
