"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BlogCommentCard } from "@/components/blog/blog-comment-card";
import { BlogCommentForm } from "@/components/blog/blog-comment-form";

type BlogComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies: BlogComment[];
};

type BlogCommentsSectionProps = {
  slug: string;
};

export function BlogCommentsSection({ slug }: BlogCommentsSectionProps) {
  const searchParams = useSearchParams();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/blog/posts/${slug}/comments`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("LOAD_COMMENTS_FAILED");
      }

      const payload = (await response.json()) as { comments?: BlogComment[] };
      setComments(payload.comments ?? []);
    } catch {
      setError("Không thể tải bình luận.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const count = useMemo(
    () => comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0),
    [comments],
  );

  const commented = searchParams.get("commented") === "true";

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="section-header">
        <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900">Bình luận ({count})</h2>
      </div>

      {commented ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Bình luận đã được gửi! Kiểm tra email để xác nhận.
        </p>
      ) : null}

      {loading ? <p className="text-sm text-slate-500">Đang tải bình luận...</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}

      {!loading && comments.length === 0 ? <p className="text-sm text-slate-500">Chưa có bình luận nào.</p> : null}

      <div className="space-y-3">
        {comments.map((comment) => (
          <BlogCommentCard key={comment.id} slug={slug} comment={comment} onReplySubmitted={() => void loadComments()} />
        ))}
      </div>

      <div className="pt-2">
        <BlogCommentForm slug={slug} onSubmitted={() => void loadComments()} />
      </div>
    </section>
  );
}
