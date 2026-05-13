import type { AbVariant } from "@/lib/ab-test-constants";
import { DifferenceBlockViewTracker } from "@/components/courses/course-storefront-tracking";

type DifferenceCard = {
  key: string;
  comparedBundleSlug: string;
  title: string;
  points: string[];
};

type Props = {
  differenceCards: DifferenceCard[];
  courseSlug: string;
  variant: AbVariant;
};

export function CourseDetailDifference({ differenceCards, courseSlug, variant }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-slate-900">How is this key different from adjacent keys?</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Compare within the same track so parents know when to choose one course and when to move up/down to another course.
      </p>

      {differenceCards.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {differenceCards.map((card) => (
            <article key={card.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <DifferenceBlockViewTracker
                variant={variant}
                bundleSlug={courseSlug}
                comparedBundleSlug={card.comparedBundleSlug}
              />
              <h3 className="text-sm font-extrabold text-slate-900">{card.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {card.points.map((point) => (
                  <li key={point} className="inline-flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          There are not yet enough adjacent keys in the same track for direct comparison. You can see the checklist above to decide
          Dinh.
        </div>
      )}
    </section>
  );
}
