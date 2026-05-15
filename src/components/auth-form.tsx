"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

interface AuthFormProps {
  mode: "signup" | "login";
  nextPath?: string | null;
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
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
  const loginInfoMessage = getLoginInfoMessageFromVerifyState(verifyState);
  const formTitle = isSignup ? "Create a parent account" : "Parent login";
  const formSubtitle = isSignup
    ? "Create an account to manage your child's profile, view sample lessons and purchase appropriate courses."
    : "Continue tracking your baby's learning progress, reports, and milestones.";

  const inputClassName =
    "h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

  function getDefaultErrorMessage() {
    return mode === "signup" ? "Unable to create account" : "Can't log in";
  }

  function isLikelyEnglishOnlyMessage(message: string) {
    return /^[A-Za-z0-9\s,.'":;!?()/-]+$/.test(message);
  }

  function getLoginInfoMessageFromVerifyState(state: string | null) {
    if (!state || isSignup) {
      return null;
    }

    if (state === "pending") {
      return "Account created. Please open your email for verification before logging in.";
    }

    if (state === "delivery-issue") {
      return "The account has been created but the system has not sent a verification email. Please try logging in again to resend your email or contact support.";
    }

    if (state === "success") {
      return "Email verified successfully. You can log in.";
    }

    if (state === "expired") {
      return "The verification link has expired. Please log in so the system can resend a verification email.";
    }

    if (state === "invalid" || state === "missing") {
      return "The verification link is not valid. Please log in to receive the verification email again.";
    }

    if (state === "signup-success") {
      return "Account created successfully. You can log in.";
    }

    return null;
  }

  function formatAuthError(
    response: Response,
    body: {
      error?: {
        message?: string;
        details?: {
          code?: string;
          retryAfterMs?: number;
          issues?: Array<{ path?: Array<string | number>; message?: string }>;
        };
      };
    } | null,
  ) {
    const fallback = getDefaultErrorMessage();
    const code = body?.error?.details?.code;
    const apiMessage = body?.error?.message;

    if (response.status === 401) {
      return "Email or password is incorrect.";
    }

    if (
      response.status === 403 &&
      (code === "EMAIL_NOT_VERIFIED" || code === "EMAIL_NOT_VERIFIED_DELIVERY_FAILED")
    ) {
      if (code === "EMAIL_NOT_VERIFIED_DELIVERY_FAILED") {
        return "The email has not been verified and the system has not yet sent the verification email back. Please try again later.";
      }
      return "Email has not been verified. The system has sent back a verification email, please check your inbox.";
    }

    if (response.status === 409 && code === "EMAIL_EXISTS") {
      return "This email has been registered. Please log in or use another email.";
    }

    if (response.status === 400 && apiMessage === "Invalid request payload") {
      const issue = body?.error?.details?.issues?.[0];
      const issuePath = String(issue?.path?.[0] ?? "");
      if (issuePath === "email") {
        return "Invalid email format.";
      }
      if (issuePath === "password") {
        return "Password needs to be between 8-120 characters.";
      }
      if (issuePath === "displayName") {
        return "Invalid display name.";
      }
      if (issuePath === "legalAccepted") {
        return "You need to agree to the Terms, Privacy Policy and Cookie Policy to register.";
      }

      return "The data submitted is invalid.";
    }

    if (response.status === 429) {
      const retryAfterHeader = Number.parseInt(response.headers.get("Retry-After") ?? "", 10);
      const retryAfterSeconds = Number.isFinite(retryAfterHeader)
        ? retryAfterHeader
        : Math.ceil((body?.error?.details?.retryAfterMs ?? 0) / 1000);

      if (retryAfterSeconds > 0) {
        return `You act too fast. Please try again later${retryAfterSeconds}second.`;
      }
      return "You act too fast. Please try again later.";
    }

    if (response.status >= 500) {
      return "The system is busy. Please try again later.";
    }

    if (apiMessage) {
      return isLikelyEnglishOnlyMessage(apiMessage) ? fallback : apiMessage;
    }

    return fallback;
  }

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

      const body = (await response.json()) as {
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
            code?: string;
            retryAfterMs?: number;
            issues?: Array<{ path?: Array<string | number>; message?: string }>;
          };
        };
      };

      if (!response.ok || !body.ok) {
        if (response.status >= 500) {
          router.push("/auth-fail");
          return;
        }
        setError(formatAuthError(response, body));
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
      setError(submitError instanceof Error ? submitError.message : getDefaultErrorMessage());
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
        <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-[2rem]">{formTitle}</h2>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{formSubtitle}</p>
      </header>

      {isSignup ? (
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Display name
          <input
            className={inputClassName}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Example: Bong's mother"
          />
        </label>
      ) : null}

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Email
        <input
          className={inputClassName}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="ban@email.com"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Password
        <input
          className={inputClassName}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          placeholder="Minimum 8 characters"
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
            I agree{" "}
            <Link href="/terms" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Terms of use
            </Link>
            ,{" "}
            <Link href="/privacy" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Privacy policy
            </Link>{" "}
            and{" "}
            <Link href="/cookie-policy" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Cookie Policy
            </Link>
            .
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
        {loading ? "Processing..." : isSignup ? "Create an account" : "Go to the control panel"}
      </button>

      {isSignup ? (
          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href={`/auth/login${nextQuery}`} className="font-bold text-emerald-700 hover:text-emerald-800">
              Log in
            </Link>
          </p>
      ) : (
        <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/auth/forgot-password" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Forgot password?
          </Link>
          <p>
            Don't have an account yet?{" "}
            <Link href={`/auth/signup${nextQuery}`} className="font-bold text-emerald-700 hover:text-emerald-800">
              Create an account
            </Link>
          </p>
        </div>
      )}
    </form>
  );
}
