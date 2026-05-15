import type { CourseClaritySnapshot } from "@/modules/courses/course-storefront-content";

type Props = {
  parentProblem: string | null;
  outcomes: string[];
  parentVisibleValue: string[];
  claritySnapshot: CourseClaritySnapshot | null;
};

export function CourseDetailParentPriorities({
  parentProblem,
  outcomes,
  parentVisibleValue,
  claritySnapshot,
}: Props) {
  const quickOutcomes = outcomes.slice(0, 3);
  const quickSignals = parentVisibleValue.slice(0, 3);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-slate-900">What do you learn in this course?</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        This page helps parents quickly answer 3 questions before deciding: what the child will learn, whether the course fits
        no, and keep an eye on the progress.
      </p>

      {parentProblem ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700">Common needs of parents</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-900">{parentProblem}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-extrabold text-emerald-900">What do you study?</p>
          <ul className="mt-3 space-y-2 text-sm text-emerald-900/90">
            {(claritySnapshot?.detailOutcomeLines.slice(0, 2) ?? quickOutcomes.slice(0, 2)).map((line) => (
              <li key={line} className="inline-flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm font-extrabold text-sky-900">Is this course suitable?</p>
          <ul className="mt-3 space-y-2 text-sm text-sky-900/90">
            {quickSignals.map((line) => (
              <li key={line} className="inline-flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-extrabold text-violet-900">How do parents monitor progress?</p>
          <ul className="mt-3 space-y-2 text-sm text-violet-900/90">
            <li className="inline-flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
              <span>Each session is 10-20 minutes, priority is given to studying regularly.</span>
            </li>
            <li className="inline-flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
              <span>
                {claritySnapshot
                  ? `Recommended landmark:${claritySnapshot.pacePerWeek} ${claritySnapshot.unitLabel}/week.`
                  : "Recommended milestone: 4-5 lessons/week."}
              </span>
            </li>
            <li className="inline-flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
              <span>Track the number of lessons completed each week to decide on the next learning level.</span>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}
