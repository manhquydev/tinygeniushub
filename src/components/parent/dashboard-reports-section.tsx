type Report = {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  lessonsCompleted: number;
  minutesLearned: number;
  streakDays: number;
  child: { id: string; nickname: string };
};

type Props = {
  reports: Report[];
};

export function DashboardReportsSection({ reports }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">Báo cáo gần nhất</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {reports.map((report) => (
          <article key={report.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-base font-black text-slate-900">{report.child.nickname}</p>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(report.weekStart).toLocaleDateString("vi-VN")} –{" "}
              {new Date(report.weekEnd).toLocaleDateString("vi-VN")}
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
              {report.lessonsCompleted} bài học • {report.minutesLearned} phút • chuỗi {report.streakDays} ngày
            </p>
          </article>
        ))}
        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
            Chưa có báo cáo tuần nào.
          </div>
        ) : null}
      </div>
    </section>
  );
}
