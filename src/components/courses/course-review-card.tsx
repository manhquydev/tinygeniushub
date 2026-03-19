import type { ReviewWithParent } from "@/modules/courses/course-review-service";

type Props = {
  review: ReviewWithParent;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400" aria-label={`${rating} sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < rating ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

export function CourseReviewCard({ review }: Props) {
  const displayName = review.parent.displayName ?? "Phụ huynh";
  const dateLabel = review.createdAt.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} />
          <span className="text-sm font-semibold text-slate-800">{displayName}</span>
        </div>
        <time className="shrink-0 text-xs text-slate-400">{dateLabel}</time>
      </div>
      {review.comment ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{review.comment}</p>
      ) : null}
    </article>
  );
}
