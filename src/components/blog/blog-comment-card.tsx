"use client";

import { useState } from "react";
import { BlogCommentForm } from "@/components/blog/blog-comment-form";

type BlogComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies: BlogComment[];
};

type BlogCommentCardProps = {
  slug: string;
  comment: BlogComment;
  depth?: number;
  onReplySubmitted?: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function avatarColor(name: string) {
  const palette = ["#f59e0b", "#06b6d4", "#8b5cf6", "#22c55e", "#ef4444", "#0ea5e9"];
  const hash = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

export function BlogCommentCard({ slug, comment, depth = 0, onReplySubmitted }: BlogCommentCardProps) {
  const [showReply, setShowReply] = useState(false);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: avatarColor(comment.authorName) }}
        >
          {comment.authorName.charAt(0).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <strong className="text-slate-900">{comment.authorName}</strong>
            <span className="text-slate-500">{formatDate(comment.createdAt)}</span>
          </div>

          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{comment.content}</p>

          {depth === 0 ? (
            <button type="button" onClick={() => setShowReply((prev) => !prev)} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
              Reply
            </button>
          ) : null}
        </div>
      </div>

      {showReply ? (
        <div className="mt-3 pl-11">
          <BlogCommentForm
            slug={slug}
            parentId={comment.id}
            onSubmitted={() => {
              setShowReply(false);
              onReplySubmitted?.();
            }}
          />
        </div>
      ) : null}

      {comment.replies.length > 0 ? (
        <div className="mt-4 space-y-3 pl-6 sm:pl-10">
          {comment.replies.map((reply) => (
            <BlogCommentCard key={reply.id} slug={slug} comment={reply} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
