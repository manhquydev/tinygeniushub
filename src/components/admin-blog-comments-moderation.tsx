"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type PendingComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  post: {
    slug: string;
    titleVi: string;
  };
};

export function AdminBlogCommentsModeration({ comments }: { comments: PendingComment[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function moderate(id: string, status: "APPROVED" | "SPAM" | "DELETED") {
    setLoadingId(id);
    try {
      const response = await fetch("/api/admin/blog/comments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) {
        throw new Error("MODERATE_FAILED");
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <article key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            <Link href={`/blog/${comment.post.slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
              {comment.post.titleVi}
            </Link>
            <p className="text-sm text-slate-700">
              <strong>{comment.authorName}</strong> · {new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(comment.createdAt))}
            </p>
            <p className="text-sm text-slate-600">{comment.content.slice(0, 100)}{comment.content.length > 100 ? "..." : ""}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => void moderate(comment.id, "APPROVED")} disabled={loadingId === comment.id}>Duyệt</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void moderate(comment.id, "SPAM")} disabled={loadingId === comment.id}>Spam</Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => void moderate(comment.id, "DELETED")} disabled={loadingId === comment.id}>Xóa</Button>
          </div>
        </article>
      ))}
    </div>
  );
}
