"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ForgotPasswordResponse = {
  ok?: boolean;
  data?: {
    message?: string;
  };
  error?: {
    message?: string;
  };
};

const DEFAULT_SUCCESS_MESSAGE =
  "If the email exists in the system, we'll send password reset instructions within minutes.";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function isLikelyEnglishOnlyMessage(message: string) {
    return /^[A-Za-z0-9\s,.'":;!?()/-]+$/.test(message);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const body = (await response.json()) as ForgotPasswordResponse;
      if (!response.ok || !body.ok) {
        const fallback = "The password reset request could not be processed.";
        const apiMessage = body.error?.message;
        setError(apiMessage && isLikelyEnglishOnlyMessage(apiMessage) ? fallback : apiMessage ?? fallback);
        return;
      }

      setSuccess(body.data?.message ?? DEFAULT_SUCCESS_MESSAGE);
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(
          isLikelyEnglishOnlyMessage(submitError.message)
            ? "The password reset request could not be processed."
            : submitError.message,
        );
      } else {
        setError("The password reset request could not be processed.");
      }
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
        <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-[2rem]">Forgot password</h2>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          Enter parent's registered email. We will send a password reset link to your inbox.
        </p>
      </header>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Account email
        <input
          className="h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="ban@email.com"
        />
      </label>

      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="solid-button full-width min-h-12 rounded-full text-sm font-bold shadow-[0_14px_28px_rgba(5,150,105,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Sending..." : "Send reset link"}
      </button>

      <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/auth/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
          Return to login
        </Link>
        <p>
          Don't have an account yet?{" "}
          <Link href="/auth/signup" className="font-bold text-emerald-700 hover:text-emerald-800">
            Create an account
          </Link>
        </p>
      </div>
    </form>
  );
}

