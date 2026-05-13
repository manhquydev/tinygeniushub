"use client";

import { FormEvent, useMemo, useState } from "react";

type BlogCommentFormProps = {
  slug: string;
  parentId?: string;
  onSubmitted?: () => void;
};

export function BlogCommentForm({ slug, parentId, onSubmitted }: BlogCommentFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentCount = useMemo(() => content.length, [content]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/blog/posts/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorName,
          authorEmail,
          content,
          parentId,
        }),
      });

      if (!response.ok) {
        throw new Error("SUBMIT_FAILED");
      }

      setSuccess(true);
      onSubmitted?.();
    } catch {
      setError("Cannot post comments. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold text-slate-700">
          Name
          <input
            type="text"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            minLength={2}
            maxLength={50}
            required
            disabled={success || loading}
            className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-semibold text-slate-700">
          Email
          <input
            type="email"
            value={authorEmail}
            onChange={(event) => setAuthorEmail(event.target.value)}
            required
            disabled={success || loading}
            className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
          />
          <p className="text-xs font-normal text-slate-500">Email is only used for confirmation, not displayed publicly.</p>
        </label>
      </div>

      <label className="space-y-1 text-sm font-semibold text-slate-700">
        Comment
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          minLength={10}
          maxLength={2000}
          required
          disabled={success || loading}
          className="min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm"
        />
        <p className="text-xs font-normal text-slate-500">{contentCount}/2000</p>
      </label>

      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm font-semibold text-emerald-700">Thanks! Check email {authorEmail} to approve the comment.</p> : null}

      <button type="submit" disabled={loading || success} className="solid-button">
        {loading ? "Sending..." : "Submit a comment"}
      </button>
    </form>
  );
}
