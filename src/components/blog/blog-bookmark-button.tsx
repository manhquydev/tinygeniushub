"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type BlogBookmarkButtonProps = {
  postId: string;
  initialBookmarked?: boolean;
};

export function BlogBookmarkButton({
  postId,
  initialBookmarked = false,
}: BlogBookmarkButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleBookmark() {
    setError(null);
    setLoading(true);
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    try {
      const response = await fetch(
        nextBookmarked
          ? "/api/reader/bookmarks"
          : `/api/reader/bookmarks/${postId}`,
        {
          method: nextBookmarked ? "POST" : "DELETE",
          headers: {
            "content-type": "application/json",
          },
          body: nextBookmarked ? JSON.stringify({ postId }) : undefined,
        },
      );

      if (response.status === 401) {
        router.push(`/reader/login?next=${encodeURIComponent(pathname || "/blog")}`);
        return;
      }

      if (!response.ok) {
        throw new Error("BOOKMARK_TOGGLE_FAILED");
      }
    } catch {
      setBookmarked(!nextBookmarked);
      setError("Posts cannot be saved at this time.");
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
        disabled={loading}
        onClick={() => void toggleBookmark()}
        className="gap-2"
      >
        {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {bookmarked ? "Saved" : "Save article"}
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
