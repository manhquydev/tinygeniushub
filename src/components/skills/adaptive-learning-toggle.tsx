"use client";

/**
 * AdaptiveLearningToggle - client component for enabling/disabling adaptive learning per child.
 */

import { useState } from "react";

interface AdaptiveLearningToggleProps {
  childId: string;
  initialEnabled: boolean;
}

export function AdaptiveLearningToggle({ childId, initialEnabled }: AdaptiveLearningToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adaptiveEnabled: !enabled }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Không thể cập nhật");
      setEnabled(!enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Học thích nghi (Adaptive)</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {enabled
              ? "Đang bật — bài học được điều chỉnh theo năng lực thực tế của bé."
              : "Đang tắt — bé học theo trình tự cố định như thông thường."}
          </p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          aria-pressed={enabled}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            enabled ? "bg-indigo-600" : "bg-slate-200"
          } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span className="sr-only">{enabled ? "Tắt học thích nghi" : "Bật học thích nghi"}</span>
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
