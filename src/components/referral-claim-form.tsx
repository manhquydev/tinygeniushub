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
        setError(body.error?.message ?? "Unable to generate referral code.");
        return;
      }

      const nextCode = body.data?.summary?.code as string | null | undefined;
      if (!nextCode) {
        setError("Unable to create referral code.");
        return;
      }

      setResolvedOwnCode(nextCode);
      setInfo("Referral code successfully generated.");
      router.refresh();
    } catch (provisionError) {
      setError(provisionError instanceof Error ? provisionError.message : "Unknown error.");
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
        setError(body.error?.message ?? "Unable to receive referral code.");
        return;
      }

      if (body.data?.result?.idempotent) {
        setInfo("This account has been assigned a referral code previously.");
      } else {
        setInfo("Received referral code successfully.");
      }
      setCode("");
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Enter referral code</h2>
      <p className="muted-text">Your code: {resolvedOwnCode ?? "Not created yet"}</p>
      {!resolvedOwnCode ? (
        <div className="hero-actions">
          <button type="button" className="solid-button" onClick={handleProvisionOwnCode} disabled={provisioning}>
            {provisioning ? "Creating..." : "Generate referral code"}
          </button>
        </div>
      ) : null}
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter referral code (Example: ABCD1234)"
          minLength={4}
          maxLength={32}
          required
          disabled={loading}
        />
        <button type="submit" className="ghost-button" disabled={loading}>
          {loading ? "Processing..." : "Get code"}
        </button>
      </form>
      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </div>
  );
}
