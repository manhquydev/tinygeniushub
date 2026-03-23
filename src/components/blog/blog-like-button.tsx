"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type BlogLikeButtonProps = {
  slug: string;
  initialLikeCount: number;
  initialLiked?: boolean;
};

export function BlogLikeButton({
  slug,
  initialLikeCount,
  initialLiked = false,
}: BlogLikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLike() {
    if (loading || liked) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/blog/posts/${slug}/like`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("RATE_LIMITED");
        }
        throw new Error("LIKE_FAILED");
      }

      const payload = (await response.json()) as {
        likeCount?: number;
        liked?: boolean;
        alreadyLiked?: boolean;
      };

      if (typeof payload.likeCount === "number") {
        setLikeCount(payload.likeCount);
      }

      if (payload.liked || payload.alreadyLiked) {
        setLiked(true);
      }
    } catch (likeError) {
      if (likeError instanceof Error && likeError.message === "RATE_LIMITED") {
        setError("Bạn thao tác quá nhanh. Vui lòng thử lại sau.");
      } else {
        setError("Không thể ghi nhận lượt thích lúc này.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading || liked}
        onClick={() => void handleLike()}
      >
        {liked ? "Đã thích" : "Thích bài viết"} ({likeCount})
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
