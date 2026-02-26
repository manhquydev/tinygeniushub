"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface AdaptiveLearningToggleProps {
  childId: string;
  initialEnabled: boolean;
}

type PatchResponse = {
  ok: boolean;
  error?: {
    message?: string;
  };
};

export function AdaptiveLearningToggle({ childId, initialEnabled }: AdaptiveLearningToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const nextEnabled = !enabled;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adaptiveEnabled: nextEnabled }),
      });

      const payload = (await response.json()) as PatchResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Không thể cập nhật trạng thái học thích nghi.");
      }

      setEnabled(nextEnabled);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Có lỗi xảy ra khi cập nhật chế độ học.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-800">
            Học thích nghi
          </h2>
          <p className="text-sm text-slate-600">
            {enabled
              ? "Đang bật: hệ thống ưu tiên bài học theo năng lực thực tế của bé."
              : "Đang tắt: bé học theo lộ trình tuần tự mặc định."}
          </p>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          aria-pressed={enabled}
          className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
            enabled
              ? "border-cyan-500 bg-cyan-500"
              : "border-slate-300 bg-slate-200"
          } ${loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
        >
          <span className="sr-only">
            {enabled ? "Tắt học thích nghi" : "Bật học thích nghi"}
          </span>
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin text-slate-500" /> : null}
          </span>
        </button>
      </div>
    </section>
  );
}

