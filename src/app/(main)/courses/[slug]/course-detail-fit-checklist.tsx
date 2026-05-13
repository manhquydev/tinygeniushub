import { CircleCheckBig } from "lucide-react";
import type { AbVariant } from "@/lib/ab-test-constants";
import { FitCheckTrackedLink } from "@/components/courses/course-storefront-tracking";
import type { FitChecklistContent } from "./course-detail-data";

type Props = {
  fitChecklist: FitChecklistContent;
  bestFor: string | null;
  courseSlug: string;
  variant: AbVariant;
};

export function CourseDetailFitChecklist({ fitChecklist, bestFor, courseSlug, variant }: Props) {
  return (
    <section id="fit-checklist" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">Fit checklist</p>
          <h2 className="mt-1 text-lg font-extrabold text-slate-900">
            Is this course suitable for my baby?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {bestFor ?? "Quickly read the checklist before paying to avoid buying for the wrong needs."}
          </p>
        </div>
        <FitCheckTrackedLink
          href="#outcome-timeline"
          className="ghost-button"
          variant={variant}
          sourcePage="course_detail"
          ctaLabel="See the results roadmap"
          bundleSlug={courseSlug}
        >
          See the results roadmap
        </FitCheckTrackedLink>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="text-sm font-extrabold text-emerald-800">Suitable if</h3>
          <ul className="mt-3 space-y-2 text-sm text-emerald-900/90">
            {fitChecklist.fitIf.map((item) => (
              <li key={item} className="inline-flex items-start gap-2">
                <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-extrabold text-amber-800">Not suitable if</h3>
          <ul className="mt-3 space-y-2 text-sm text-amber-900/90">
            {fitChecklist.notFitIf.map((item) => (
              <li key={item} className="inline-flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <h3 className="text-sm font-extrabold text-sky-800">Should buy when</h3>
          <ul className="mt-3 space-y-2 text-sm text-sky-900/90">
            {fitChecklist.buyWhen.map((item) => (
              <li key={item} className="inline-flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
