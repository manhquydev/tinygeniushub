"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

interface AuthFormProps {
  mode: "signup" | "login";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";
  const formTitle = isSignup ? "Tạo tài khoản phụ huynh" : "Đăng nhập phụ huynh";
  const formSubtitle = isSignup
    ? "Kích hoạt trial 7 ngày và khởi tạo hành trình học được cá nhân hóa cho bé."
    : "Tiếp tục theo dõi tiến độ học tập, báo cáo và các mốc phát triển mới của bé.";
  const inputClassName =
    "h-12 rounded-xl border border-slate-300/90 bg-white px-3 text-[0.96rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

  function getDefaultErrorMessage() {
    return mode === "signup" ? "Không thể tạo tài khoản" : "Không thể đăng nhập";
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
      return "Email hoặc mật khẩu chưa đúng.";
    }

    if (response.status === 409 && code === "EMAIL_EXISTS") {
      return "Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.";
    }

    if (response.status === 400 && apiMessage === "Invalid request payload") {
      const issue = body?.error?.details?.issues?.[0];
      const issuePath = String(issue?.path?.[0] ?? "");
      if (issuePath === "email") {
        return "Email không đúng định dạng.";
      }
      if (issuePath === "password") {
        return "Mật khẩu phải từ 8 đến 120 ký tự.";
      }
      if (issuePath === "displayName") {
        return "Tên hiển thị không hợp lệ.";
      }

      return "Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.";
    }

    if (response.status === 429) {
      const retryAfterHeader = Number.parseInt(response.headers.get("Retry-After") ?? "", 10);
      const retryAfterSeconds = Number.isFinite(retryAfterHeader)
        ? retryAfterHeader
        : Math.ceil((body?.error?.details?.retryAfterMs ?? 0) / 1000);

      if (retryAfterSeconds > 0) {
        return `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`;
      }
      return "Bạn thao tác quá nhanh. Vui lòng thử lại sau.";
    }

    if (response.status >= 500) {
      return "Hệ thống đang bận. Vui lòng thử lại sau ít phút.";
    }

    return apiMessage ?? fallback;
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
        }),
      });

      const body = (await response.json()) as {
        ok?: boolean;
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
        trackEvent("trial_start", { plan: "trial_7day" });
        trackEvent("complete_registration");
      }

      router.push("/parent/dashboard");
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
          Tên hiển thị
          <input
            className={inputClassName}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Ví dụ: Mẹ của Bông"
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
          placeholder="me@domain.com"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Mật khẩu
        <input
          className={inputClassName}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          placeholder="Ít nhất 8 ký tự"
        />
      </label>

      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="solid-button full-width min-h-12 rounded-full text-sm font-bold shadow-[0_14px_28px_rgba(5,150,105,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Đang xử lý..." : isSignup ? "Bắt đầu dùng thử 7 ngày" : "Vào dashboard"}
      </button>

      {isSignup ? (
        <p className="text-center text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" className="font-bold text-emerald-700 hover:text-emerald-800">
            Đăng nhập ngay
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/auth/forgot-password" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Quên mật khẩu?
          </Link>
          <p>
            Chưa có tài khoản?{" "}
            <Link href="/auth/signup" className="font-bold text-emerald-700 hover:text-emerald-800">
              Tạo tài khoản trial
            </Link>
          </p>
        </div>
      )}
    </form>
  );
}
