"use client";

import { useState } from "react";

type Props = {
  courseSlug: string;
  existingRating?: number;
  existingComment?: string;
};

const MAX_COMMENT_LENGTH = 1000;

export function CourseReviewForm({ courseSlug, existingRating, existingComment }: Props) {
  const [rating, setRating] = useState<number>(existingRating ?? 0);
  const [hovered, setHovered] = useState<number>(0);
  const [comment, setComment] = useState(existingComment ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setErrorMessage("Please select the number of rating stars.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(`/api/courses/${courseSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to submit review.");
      }

      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An error has occurred.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Review sent, awaiting approval.
      </div>
    );
  }

  const displayRating = hovered > 0 ? hovered : rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Choose number of stars</p>
        <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="text-2xl leading-none transition-colors"
              style={{ color: star <= displayRating ? "#f59e0b" : "#cbd5e1" }}
              onMouseEnter={() => setHovered(star)}
              onClick={() => setRating(star)}
              aria-label={`${star} sao`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-comment" className="mb-1 block text-sm font-semibold text-slate-700">
          Review <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          placeholder="Share your child's learning experience..."
          rows={4}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <p className="mt-1 text-right text-xs text-slate-400">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </p>
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {status === "loading" ? "Sending..." : "Submit a review"}
      </button>
    </form>
  );
}
