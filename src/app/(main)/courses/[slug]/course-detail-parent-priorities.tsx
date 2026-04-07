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
      <h2 className="text-lg font-extrabold text-slate-900">Con học gì trong khóa này?</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Trọng tâm của trang này là giúp phụ huynh trả lời nhanh 3 câu hỏi trước khi quyết định: con học gì, khóa có hợp
        không, và theo dõi tiến bộ ra sao.
      </p>

      {parentProblem ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700">Nhu cầu phụ huynh thường gặp</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-900">{parentProblem}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-extrabold text-emerald-900">Con học gì?</p>
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
          <p className="text-sm font-extrabold text-sky-900">Khóa này có hợp không?</p>
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
          <p className="text-sm font-extrabold text-violet-900">Ba mẹ theo dõi tiến bộ ra sao?</p>
          <ul className="mt-3 space-y-2 text-sm text-violet-900/90">
            <li className="inline-flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
              <span>Mỗi buổi 10-20 phút, ưu tiên đều đặn hơn học dồn.</span>
            </li>
            <li className="inline-flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
              <span>
                {claritySnapshot
                  ? `Mốc khuyến nghị: ${claritySnapshot.pacePerWeek} ${claritySnapshot.unitLabel}/tuần.`
                  : "Mốc khuyến nghị: 4-5 bài/tuần."}
              </span>
            </li>
            <li className="inline-flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
              <span>Theo dõi số bài hoàn thành theo tuần để quyết định lên mức học tiếp theo.</span>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}
