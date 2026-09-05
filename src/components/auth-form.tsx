"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/track-event";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

interface AuthFormProps {
  mode: "signup" | "login";
  nextPath?: string | null;
}

type AuthFailBody = {
  ok?: boolean;
  data?: {
    verification?: {
      required?: boolean;
      emailDispatch?: "queued" | "failed" | "not_required";
    };
  };
  error?: {
    message?: string;
    details?: {
      retryAfterMs?: number;
      issues?: Array<{ path?: Array<string | number>; message?: string }>;
    };
  };
};

const VERIFY_MESSAGE_KEYS: Record<string, string> = {
  pending: "verify.pending",
  "delivery-issue": "verify.deliveryIssue",
  success: "verify.success",
  expired: "verify.expired",
  invalid: "verify.invalid",
  missing: "verify.invalid",
  "signup-success": "verify.signupSuccess",
};

const AUTH_FORM_ERROR_KEYS: Record<string, string> = {
  "Invalid credentials": "errors.invalidCredentials",
  "Invalid credentials.": "errors.invalidCredentials",
  "Email or password is incorrect.": "errors.invalidCredentials",
  "The email has not been verified and the system has not yet sent the verification email back. Please try again later.":
    "errors.emailNotVerifiedDeliveryFailed",
  "Email has not been verified, and we could not resend the verification email. Please try again later.":
    "errors.emailNotVerifiedDeliveryFailed",
  "Email has not been verified. We have sent you a verification email again, please check your inbox.":
    "errors.emailNotVerified",
  "Email has not been verified. The system has sent back a verification email, please check your inbox.":
    "errors.emailNotVerified",
  "Email has not been verified. We sent another verification email — please check your inbox.":
    "errors.emailNotVerified",
  "Email already exists": "errors.emailExists",
  "This email has been registered. Please log in or use another email.": "errors.emailExists",
  "This email is already registered. Please log in or use another email.": "errors.emailExists",
  "Invalid request payload": "errors.invalidPayload",
  "Invalid request payload.": "errors.invalidPayload",
  "Invalid JSON payload": "errors.invalidPayload",
  "Invalid JSON payload.": "errors.invalidPayload",
  "Too many login attempts. Please retry later.": "errors.rateLimited",
  "Too many signup attempts. Please retry later.": "errors.rateLimited",
  "Too many requests. Please retry later.": "errors.rateLimited",
  "Too many requests": "errors.rateLimited",
  "The system is busy. Please try again later.": "errors.serverBusy",
  "Internal server error": "errors.serverBusy",
  "Unexpected error": "errors.serverBusy",
};

function isLikelyEnglishOnlyMessage(message: string) {
  return /^[\x20-\x7E\u2013\u2014\u2026]+$/.test(message);
}

function resolveMappedMessage(
  message: string | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
  unknown: string,
) {
  if (!message) {
    return unknown;
  }
  const key = AUTH_FORM_ERROR_KEYS[message];
  if (key) {
    return t(key);
  }
  if (!isLikelyEnglishOnlyMessage(message)) {
    return message;
  }
  return unknown;
}

function formatAuthError(
  response: Response,
  body: AuthFailBody | null,
  t: (key: string, values?: Record<string, string | number>) => string,
  unknown: string,
) {
  const apiMessage = body?.error?.message?.trim();
  if (apiMessage && !isLikelyEnglishOnlyMessage(apiMessage) && !AUTH_FORM_ERROR_KEYS[apiMessage]) {
    return apiMessage;
  }

  if (response.status === 400 && (apiMessage === "Invalid request payload" || apiMessage === "Invalid request payload.")) {
    const issuePath = String(body?.error?.details?.issues?.[0]?.path?.[0] ?? "");
    if (issuePath === "email") {
      return t("errors.invalidEmail");
    }
    if (issuePath === "password") {
      return t("errors.invalidPassword");
    }
    if (issuePath === "displayName") {
      return t("errors.invalidDisplayName");
    }
    if (issuePath === "legalAccepted") {
      return t("errors.legalRequired");
    }
    return t("errors.invalidPayload");
  }

  if (response.status === 429) {
    const retryAfterHeader = Number.parseInt(response.headers.get("Retry-After") ?? "", 10);
    const retryAfterSeconds = Number.isFinite(retryAfterHeader)
      ? retryAfterHeader
      : Math.ceil((body?.error?.details?.retryAfterMs ?? 0) / 1000);
    if (retryAfterSeconds > 0) {
      return t("errors.rateLimitedWithSeconds", { seconds: retryAfterSeconds });
    }
    return t("errors.rateLimited");
  }

  return resolveMappedMessage(apiMessage, t, unknown);
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const t = useTranslations("auth.form");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";
  const safeNextPath = sanitizeNextPath(nextPath);
  const nextQuery = safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : "";
  const postAuthPath = safeNextPath ?? "/parent/dashboard";
  const verifyState = searchParams.get("verify");
  const verifyKey = !isSignup && verifyState ? VERIFY_MESSAGE_KEYS[verifyState] : undefined;
  const loginInfoMessage = verifyKey ? t(verifyKey) : null;
  const unknownError = tErrors("unknown");

  const inputClassName =
    "h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          displayName: isSignup ? displayName : undefined,
          legalAccepted: isSignup ? legalAccepted : undefined,
        }),
      });

      const body = (await response.json()) as AuthFailBody;

      if (!response.ok || !body.ok) {
        if (response.status >= 500) {
          router.push("/auth-fail");
          return;
        }
        setError(formatAuthError(response, body, t, unknownError));
        return;
      }

      if (isSignup) {
        trackEvent("complete_registration");
        const verification = body.data?.verification;
        if (verification?.required) {
          const verifyStatus = verification.emailDispatch === "queued" ? "pending" : "delivery-issue";
          router.push(`/auth/login?verify=${encodeURIComponent(verifyStatus)}`);
          router.refresh();
          return;
        }
        router.push("/auth/login?verify=signup-success");
        router.refresh();
        return;
      }

      router.push(postAuthPath);
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : undefined;
      setError(resolveMappedMessage(message, t, unknownError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="auth-form grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_56px_rgba(15,23,42,0.12)] sm:p-8"
      onSubmit={handleSubmit}
    >
      <header className="grid gap-2">
        <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-[2rem]">
          {isSignup ? t("signup.title") : t("login.title")}
        </h2>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          {isSignup ? t("signup.subtitle") : t("login.subtitle")}
        </p>
      </header>

      {isSignup ? (
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          {t("signup.displayNameLabel")}
          <input
            className={inputClassName}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={t("signup.displayNamePlaceholder")}
          />
        </label>
      ) : null}

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        {t("fields.emailLabel")}
        <input
          className={inputClassName}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder={t("fields.emailPlaceholder")}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        {t("fields.passwordLabel")}
        <input
          className={inputClassName}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          placeholder={t("fields.passwordPlaceholder")}
        />
      </label>

      {isSignup ? (
        <label className="inline-checkbox text-sm text-slate-700">
          <input
            type="checkbox"
            checked={legalAccepted}
            onChange={(event) => setLegalAccepted(event.target.checked)}
            required
          />
          <span>
            {t.rich("signup.legal.agree", {
              terms: (chunks) => (
                <Link href="/terms" className="font-semibold text-emerald-700 hover:text-emerald-800">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className="font-semibold text-emerald-700 hover:text-emerald-800">
                  {chunks}
                </Link>
              ),
              cookie: (chunks) => (
                <Link href="/cookie-policy" className="font-semibold text-emerald-700 hover:text-emerald-800">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
      ) : null}

      {loginInfoMessage ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {loginInfoMessage}
        </p>
      ) : null}
      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || (isSignup && !legalAccepted)}
        className="solid-button full-width min-h-12 rounded-full text-sm font-bold shadow-[0_14px_28px_rgba(5,150,105,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? t("fields.submitLoading") : isSignup ? t("signup.submit") : t("login.submit")}
      </button>

      {isSignup ? (
        <p className="text-center text-sm text-slate-600">
          {t("signup.alreadyHaveAccount")}{" "}
          <Link href={`/auth/login${nextQuery}`} className="font-bold text-emerald-700 hover:text-emerald-800">
            {t("signup.logIn")}
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/auth/forgot-password" className="font-semibold text-emerald-700 hover:text-emerald-800">
            {t("login.forgotPassword")}
          </Link>
          <p>
            {t("login.noAccountYet")}{" "}
            <Link href={`/auth/signup${nextQuery}`} className="font-bold text-emerald-700 hover:text-emerald-800">
              {t("login.createAccount")}
            </Link>
          </p>
        </div>
      )}
    </form>
  );
}
