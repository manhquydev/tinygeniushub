"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type ResetPasswordResponse = {
  ok?: boolean;
  data?: {
    message?: string;
  };
  error?: {
    message?: string;
  };
};

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [token, setToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("New password must be 8 characters or more.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Re-entered password does not match.");
      return;
    }
    if (!token.trim()) {
      setError("Missing password reset authentication code.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });

      const body = (await response.json()) as ResetPasswordResponse;
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Unable to reset password.");
        return;
      }

      setSuccess(body.data?.message ?? "Reset password successfully. You can log in again.");
      setTimeout(() => {
        router.push("/auth/login");
      }, 900);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_56px_rgba(15,23,42,0.12)] sm:p-8"
      onSubmit={handleSubmit}
    >
      <header className="grid gap-2">
        <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-[2rem]">Reset password</h2>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          Enter a new password for the parent account. The reset link is only valid for a short time.
        </p>
      </header>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Authentication code reset
        <input
          className="h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
          placeholder="Paste the verification code from the email"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        New password
        <input
          className="h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Re-enter the new password
        <input
          className="h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={8}
          placeholder="Re-enter the password"
        />
      </label>

      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="solid-button full-width min-h-12 rounded-full text-sm font-bold shadow-[0_14px_28px_rgba(5,150,105,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Updating..." : "Save new password"}
      </button>

      <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/auth/forgot-password" className="font-semibold text-emerald-700 hover:text-emerald-800">
          Back to forgotten password
        </Link>
        <Link href="/auth/login" className="font-bold text-emerald-700 hover:text-emerald-800">
          About login
        </Link>
      </div>
    </form>
  );
}
