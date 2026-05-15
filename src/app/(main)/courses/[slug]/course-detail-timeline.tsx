import { BookOpen } from "lucide-react";
import type { AbVariant } from "@/lib/ab-test-constants";
import { OutcomeTimelineViewTracker } from "@/components/courses/course-storefront-tracking";
import type { CourseClaritySnapshot } from "@/modules/courses/course-storefront-content";
import type { TimelineStage } from "./course-detail-data";

type Props = {
  outcomeTimeline: TimelineStage[];
  courseSlug: string;
  variant: AbVariant;
  claritySnapshot: CourseClaritySnapshot | null;
};

export function CourseDetailTimeline({ outcomeTimeline, courseSlug, variant, claritySnapshot }: Props) {
  return (
    <>
      <OutcomeTimelineViewTracker variant={variant} bundleSlug={courseSlug} milestones={outcomeTimeline.length} />
      <section id="outcome-timeline" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <BookOpen className="h-5 w-5 text-sky-600" />
          Post-purchase results roadmap
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Presented according to a timeline so that parents can clearly visualize the value received, no longer feeling vague.
        </p>
        {claritySnapshot ? (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-sky-700">
              Checkpoint specific to {claritySnapshot.scopeLabel}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-sky-900">
              {claritySnapshot.detailOutcomeLines.map((line) => (
                <li key={line} className="inline-flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {outcomeTimeline.map((stage) => (
            <article key={stage.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-extrabold text-slate-900">{stage.label}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {stage.points.map((point) => (
                  <li key={point} className="inline-flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
