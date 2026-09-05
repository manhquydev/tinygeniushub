"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type ResetPasswordResponse = {
  ok?: boolean;
  data?: {
    message?: string;
  };
  error?: {
    message?: string;
  };
};

const RESET_ERROR_KEYS: Record<string, string> = {
  "Unable to reset password.": "errors.generic",
  "The password reset link is invalid or has expired.": "errors.generic",
  "New password must be 8 characters or more.": "errors.passwordTooShort",
  "New password must be at least 8 characters.": "errors.passwordTooShort",
  "Re-entered password does not match.": "errors.passwordMismatch",
  "The passwords do not match.": "errors.passwordMismatch",
  "Missing password reset authentication code.": "errors.missingToken",
  "Missing password reset code.": "errors.missingToken",
};

const GLOBAL_ERROR_KEYS: Record<string, string> = {
  "Invalid request payload": "invalidPayload",
  "Invalid JSON payload": "invalidJson",
  "Too many requests. Please retry later.": "rateLimited",
  "Too many requests": "rateLimited",
};

function isLikelyEnglishOnlyMessage(message: string) {
  return /^[\x20-\x7E\u2013\u2014\u2026]+$/.test(message);
}

export function ResetPasswordForm() {
  const t = useTranslations("auth.reset");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [token, setToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const unknownError = tErrors("unknown");

  function resolveErrorMessage(message: string | undefined) {
    if (!message) {
      return t("errors.generic");
    }
    const localKey = RESET_ERROR_KEYS[message];
    if (localKey) {
      return t(localKey);
    }
    const globalKey = GLOBAL_ERROR_KEYS[message];
    if (globalKey) {
      return tErrors(globalKey);
    }
    if (!isLikelyEnglishOnlyMessage(message)) {
      return message;
    }
    return unknownError;
  }

  function resolveSuccessMessage(message: string | undefined) {
    if (message && !isLikelyEnglishOnlyMessage(message)) {
      return message;
    }
    return t("successDefault");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }
    if (!token.trim()) {
      setError(t("errors.missingToken"));
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
        setError(resolveErrorMessage(body.error?.message));
        return;
      }

      setSuccess(resolveSuccessMessage(body.data?.message));
      setTimeout(() => {
        router.push("/auth/login");
      }, 900);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : undefined;
      setError(resolveErrorMessage(message));
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
        <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-[2rem]">{t("title")}</h2>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{t("subtitle")}</p>
      </header>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        {t("tokenLabel")}
        <input
          className="h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
          placeholder={t("tokenPlaceholder")}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        {t("newPasswordLabel")}
        <input
          className="h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          minLength={8}
          placeholder={t("newPasswordPlaceholder")}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        {t("confirmPasswordLabel")}
        <input
          className="h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={8}
          placeholder={t("confirmPasswordPlaceholder")}
        />
      </label>

      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="solid-button full-width min-h-12 rounded-full text-sm font-bold shadow-[0_14px_28px_rgba(5,150,105,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? t("submitLoading") : t("submit")}
      </button>

      <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/auth/forgot-password" className="font-semibold text-emerald-700 hover:text-emerald-800">
          {t("backToForgot")}
        </Link>
        <Link href="/auth/login" className="font-bold text-emerald-700 hover:text-emerald-800">
          {t("aboutLogin")}
        </Link>
      </div>
    </form>
  );
}
