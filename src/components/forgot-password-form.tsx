"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

type ForgotPasswordResponse = {
  ok?: boolean;
  data?: {
    message?: string;
  };
  error?: {
    message?: string;
  };
};

const FORGOT_ERROR_KEYS: Record<string, "errors.generic" | "global"> = {
  "The password reset request could not be processed.": "errors.generic",
};

const GLOBAL_ERROR_KEYS: Record<string, string> = {
  "Forgot password function is being configured. Please contact support while waiting for updates.":
    "passwordResetNotEnabled",
  "Invalid request payload": "invalidPayload",
  "Invalid JSON payload": "invalidJson",
  "Too many requests. Please retry later.": "rateLimited",
  "Too many requests": "rateLimited",
};

function isLikelyEnglishOnlyMessage(message: string) {
  return /^[\x20-\x7E\u2013\u2014\u2026]+$/.test(message);
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const tErrors = useTranslations("errors");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const unknownError = tErrors("unknown");

  function resolveErrorMessage(message: string | undefined) {
    if (!message) {
      return t("errors.generic");
    }
    const localKey = FORGOT_ERROR_KEYS[message];
    if (localKey === "errors.generic") {
      return t("errors.generic");
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
        setError(resolveErrorMessage(body.error?.message));
        return;
      }

      setSuccess(resolveSuccessMessage(body.data?.message));
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
        {t("emailLabel")}
        <input
          className="h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder={t("emailPlaceholder")}
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
        <Link href="/auth/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
          {t("returnToLogin")}
        </Link>
        <p>
          {t("noAccountYet")}{" "}
          <Link href="/auth/signup" className="font-bold text-emerald-700 hover:text-emerald-800">
            {t("createAccount")}
          </Link>
        </p>
      </div>
    </form>
  );
}
