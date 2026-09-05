"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type RedeemResult = { ok: boolean; error?: string };

export function GiftCodeForm() {
  const t = useTranslations("giftCode.form");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gift-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = (await res.json()) as RedeemResult;
      if (json.ok) {
        setSuccess(true);
      } else {
        setError(json.error ?? t("invalid"));
      }
    } catch {
      setError(t("connectError"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          padding: "1.5rem",
          borderRadius: 16,
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#15803d" }}>{t("success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
      <label htmlFor="gift-code" style={{ fontWeight: 600 }}>
        {t("label")}
      </label>
      <input
        id="gift-code"
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder={t("placeholder")}
        required
        disabled={loading}
        style={{
          minHeight: 44,
          borderRadius: 12,
          border: "1px solid rgba(15,23,42,0.2)",
          padding: "0 1rem",
          fontSize: "1rem",
          fontFamily: "inherit",
          letterSpacing: "0.05em",
          background: "white",
          width: "100%",
        }}
      />
      {error && <p className="error-text">{error}</p>}
      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="solid-button"
        style={{ width: "fit-content", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? t("activating") : t("submit")}
      </button>
    </form>
  );
}
