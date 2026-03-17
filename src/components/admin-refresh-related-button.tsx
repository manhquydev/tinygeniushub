"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminRefreshRelatedButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}/refresh-related`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("REFRESH_FAILED");
      }

      setMessage("Đã cập nhật bài liên quan.");
    } catch {
      setError("Không thể cập nhật bài liên quan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" onClick={handleRefresh} disabled={loading} className="w-fit">
        {loading ? "Đang cập nhật..." : "Cập nhật bài liên quan"}
      </Button>
      {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
