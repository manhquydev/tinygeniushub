import { getApprovedReviews, getRatingDistribution } from "@/modules/courses/course-review-service";
import { CourseRatingDistribution } from "@/components/courses/course-rating-distribution";
import { CourseReviewCard } from "@/components/courses/course-review-card";
import { CourseReviewForm } from "@/components/courses/course-review-form";

type Props = {
  courseId: string;
  courseSlug: string;
  parentId: string | null;
  isOwned: boolean;
};

export async function CourseReviewsSection({ courseId, courseSlug, parentId, isOwned }: Props) {
  const [paginated, distribution] = await Promise.all([
    getApprovedReviews(courseId, 1),
    getRatingDistribution(courseId),
  ]);

  const { reviews, total } = paginated;
  const avgRating =
    total > 0
      ? (Object.entries(distribution) as [string, number][]).reduce(
          (sum, [star, count]) => sum + Number(star) * count,
          0,
        ) / total
      : 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-slate-900">Reviews from parents</h2>

      <div className="mt-4 grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="space-y-3">
          {total > 0 ? (
            <div className="text-center">
              <p className="text-4xl font-black text-slate-900">{avgRating.toFixed(1)}</p>
              <p className="text-xs text-slate-500">{total} reviews</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">There are no reviews yet.</p>
          )}
          <CourseRatingDistribution distribution={distribution} total={total} />
        </div>

        <div className="space-y-3">
          {reviews.length > 0 ? (
            reviews.map((review) => <CourseReviewCard key={review.id} review={review} />)
          ) : (
            <p className="text-sm text-slate-500">Be the first to review this course.</p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-6">
        {isOwned && parentId ? (
          <div>
            <h3 className="mb-3 text-base font-bold text-slate-900">Write your review</h3>
            <CourseReviewForm courseSlug={courseSlug} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Purchase key to write a review.
          </p>
        )}
      </div>
    </section>
  );
}
