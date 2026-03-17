"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface ReferralClaimFormProps {
  ownCode: string | null;
}

export function ReferralClaimForm({ ownCode }: ReferralClaimFormProps) {
  const router = useRouter();
  const [resolvedOwnCode, setResolvedOwnCode] = useState<string | null>(ownCode);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleProvisionOwnCode() {
    setProvisioning(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/referrals/me", {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể tạo mã giới thiệu.");
        return;
      }

      const nextCode = body.data?.summary?.code as string | null | undefined;
      if (!nextCode) {
        setError("Không thể tạo mã referral.");
        return;
      }

      setResolvedOwnCode(nextCode);
      setInfo("Đã tạo mã giới thiệu thành công.");
      router.refresh();
    } catch (provisionError) {
      setError(provisionError instanceof Error ? provisionError.message : "Lỗi không xác định.");
    } finally {
      setProvisioning(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/referrals/claim", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể nhận mã giới thiệu.");
        return;
      }

      if (body.data?.result?.idempotent) {
        setInfo("Tài khoản này đã được gán mã giới thiệu trước đó.");
      } else {
        setInfo("Nhận mã giới thiệu thành công.");
      }
      setCode("");
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Nhập mã giới thiệu</h2>
      <p className="muted-text">Mã của bạn: {resolvedOwnCode ?? "Chưa tạo"}</p>
      {!resolvedOwnCode ? (
        <div className="hero-actions">
          <button type="button" className="solid-button" onClick={handleProvisionOwnCode} disabled={provisioning}>
            {provisioning ? "Đang tạo..." : "Tạo mã giới thiệu"}
          </button>
        </div>
      ) : null}
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Nhập mã giới thiệu (VD: ABCD1234)"
          minLength={4}
          maxLength={32}
          required
          disabled={loading}
        />
        <button type="submit" className="ghost-button" disabled={loading}>
          {loading ? "Đang xử lý..." : "Nhận mã"}
        </button>
      </form>
      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </div>
  );
}
