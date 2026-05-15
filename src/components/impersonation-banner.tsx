"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ImpersonationBannerProps = {
  parentEmail: string;
};

type StopImpersonationResponse = {
  ok: boolean;
  data?: {
    redirectTo?: string;
  };
  error?: {
    message?: string;
  };
};

export function ImpersonationBanner({ parentEmail }: ImpersonationBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function stopImpersonation() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/impersonate/stop", {
        method: "POST",
      });
      const body = (await response.json()) as StopImpersonationResponse;

      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Cannot stop alternate view.");
        return;
      }

      const redirectTo = body.data?.redirectTo ?? "/admin";
      router.push(redirectTo);
      router.refresh();
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-amber-200 bg-amber-100/95 px-3 py-2 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-sm text-amber-900">
        <p className="font-semibold">👁 Viewing as {parentEmail}</p>
        <button
          type="button"
          onClick={() => {
            void stopImpersonation();
          }}
          disabled={loading}
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-amber-400 bg-white px-3 font-semibold text-amber-800 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Stopping..." : "Stop watching"}
        </button>
      </div>
      {error ? <p className="mx-auto mt-1 max-w-6xl text-xs font-medium text-rose-700">{error}</p> : null}
    </div>
  );
}
