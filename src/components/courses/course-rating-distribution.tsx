import type { RatingDistribution } from "@/modules/courses/course-review-service";

type Props = {
  distribution: RatingDistribution;
  total: number;
};

export function CourseRatingDistribution({ distribution, total }: Props) {
  return (
    <div className="space-y-2">
      {([5, 4, 3, 2, 1] as const).map((star) => {
        const count = distribution[star];
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2">
            <span className="w-7 text-right text-sm text-slate-700">{star}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-6 text-right text-xs text-slate-500">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
