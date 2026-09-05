"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface ReferralClaimFormProps {
  ownCode: string | null;
}

export function ReferralClaimForm({ ownCode }: ReferralClaimFormProps) {
  const t = useTranslations("parent.referralClaim");
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
        setError(body.error?.message ?? t("generateError"));
        return;
      }

      const nextCode = body.data?.summary?.code as string | null | undefined;
      if (!nextCode) {
        setError(t("createError"));
        return;
      }

      setResolvedOwnCode(nextCode);
      setInfo(t("generated"));
      router.refresh();
    } catch (provisionError) {
      setError(provisionError instanceof Error ? provisionError.message : t("unknownError"));
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
        setError(body.error?.message ?? t("claimError"));
        return;
      }

      if (body.data?.result?.idempotent) {
        setInfo(t("alreadyAssigned"));
      } else {
        setInfo(t("claimed"));
      }
      setCode("");
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>{t("heading")}</h2>
      <p className="muted-text">{t("yourCode", { code: resolvedOwnCode ?? t("notCreated") })}</p>
      {!resolvedOwnCode ? (
        <div className="hero-actions">
          <button type="button" className="solid-button" onClick={handleProvisionOwnCode} disabled={provisioning}>
            {provisioning ? t("creating") : t("generate")}
          </button>
        </div>
      ) : null}
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t("placeholder")}
          minLength={4}
          maxLength={32}
          required
          disabled={loading}
        />
        <button type="submit" className="ghost-button" disabled={loading}>
          {loading ? t("processing") : t("submit")}
        </button>
      </form>
      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </div>
  );
}
