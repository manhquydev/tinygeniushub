"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
          displayName: mode === "signup" ? displayName : undefined,
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
        setError(formatAuthError(response, body));
        return;
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
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1>{mode === "signup" ? "Tạo tài khoản phụ huynh" : "Đăng nhập phụ huynh"}</h1>

      {mode === "signup" ? (
        <label>
          Tên hiển thị
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Ví dụ: Mẹ của Bông"
          />
        </label>
      ) : null}

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="me@domain.com"
        />
      </label>

      <label>
        Mật khẩu
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          placeholder="Ít nhất 8 ký tự"
        />
      </label>

      {error ? <p className="error-text">{error}</p> : null}

      <button type="submit" disabled={loading} className="solid-button full-width">
        {loading ? "Đang xử lý..." : mode === "signup" ? "Bắt đầu dùng thử 7 ngày" : "Vào dashboard"}
      </button>
    </form>
  );
}
