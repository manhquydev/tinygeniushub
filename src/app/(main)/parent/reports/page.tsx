import { ReportsPanel } from "@/components/reports-panel";
import { requireParent } from "@/lib/auth/require-parent";
import { getLatestWeeklyReports, getWeeklyTrend, type WeeklyTrend } from "@/modules/reports/weekly-report-service";

type ReportWithBaseMetrics = {
  id: string;
  childId: string;
  generatedAt: Date;
  lessonsCompleted: number;
  minutesLearned: number;
  streakDays: number;
};

function attachTrends<T extends ReportWithBaseMetrics>(reports: T[]): Array<T & { trend: WeeklyTrend }> {
  const trendByReportId = new Map<string, WeeklyTrend>();
  const reportsByChild = reports.reduce<Map<string, T[]>>((acc, report) => {
    const existing = acc.get(report.childId) ?? [];
    existing.push(report);
    acc.set(report.childId, existing);
    return acc;
  }, new Map());

  for (const [childId, childReports] of reportsByChild.entries()) {
    const sorted = [...childReports].sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index];
      const previous = sorted[index + 1] ?? null;
      trendByReportId.set(current.id, getWeeklyTrend(childId, current, previous));
    }
  }

  return reports.map((report) => ({
    ...report,
    trend: trendByReportId.get(report.id) ?? getWeeklyTrend(report.childId, report, null),
  }));
}

export default async function ParentReportsPage() {
  const parent = await requireParent();
  const reports = attachTrends(await getLatestWeeklyReports(parent.id));

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200/75 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <p className="inline-flex w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Parent Reports
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-900 sm:text-4xl">Center for learning analytics</h1>
        <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-slate-600 sm:text-base">
          Track each child&apos;s weekly learning performance: study time, skill outcomes, and concrete action suggestions so parents can support more effectively.
        </p>
      </section>

      <ReportsPanel initialReports={reports} />
    </div>
  );
}
