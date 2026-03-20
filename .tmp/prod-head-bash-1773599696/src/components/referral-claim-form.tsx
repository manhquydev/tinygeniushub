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
        setError(body.error?.message ?? "KhÃ´ng thá»ƒ táº¡o mÃ£ giá»›i thiá»‡u.");
        return;
      }

      const nextCode = body.data?.summary?.code as string | null | undefined;
      if (!nextCode) {
        setError("Không thể tạo mã referral.");
        return;
      }

      setResolvedOwnCode(nextCode);
      setInfo("ÄÃ£ táº¡o mÃ£ giá»›i thiá»‡u thÃ nh cÃ´ng.");
      router.refresh();
    } catch (provisionError) {
      setError(provisionError instanceof Error ? provisionError.message : "Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh.");
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
        setError(body.error?.message ?? "KhÃ´ng thá»ƒ nháº­n mÃ£ giá»›i thiá»‡u.");
        return;
      }

      if (body.data?.result?.idempotent) {
        setInfo("TÃ i khoáº£n nÃ y Ä‘Ã£ Ä‘Æ°á»£c gÃ¡n mÃ£ giá»›i thiá»‡u trÆ°á»›c Ä‘Ã³.");
      } else {
        setInfo("Nháº­n mÃ£ giá»›i thiá»‡u thÃ nh cÃ´ng.");
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
      <h2>Nháº­p mÃ£ giá»›i thiá»‡u</h2>
      <p className="muted-text">MÃ£ cá»§a báº¡n: {resolvedOwnCode ?? "ChÆ°a táº¡o"}</p>
      {!resolvedOwnCode ? (
        <div className="hero-actions">
          <button type="button" className="solid-button" onClick={handleProvisionOwnCode} disabled={provisioning}>
            {provisioning ? "Äang táº¡o..." : "Táº¡o mÃ£ giá»›i thiá»‡u"}
          </button>
        </div>
      ) : null}
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Nháº­p mÃ£ giá»›i thiá»‡u (VD: ABCD1234)"
          minLength={4}
          maxLength={32}
          required
          disabled={loading}
        />
        <button type="submit" className="ghost-button" disabled={loading}>
          {loading ? "Äang xá»­ lÃ½..." : "Nháº­n mÃ£"}
        </button>
      </form>
      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </div>
  );
}
