import { DashboardChildCard, type RecentCompletion } from "./dashboard-child-card";

type Child = { id: string; nickname: string; adaptiveEnabled: boolean };

type ChildWithProgress = {
  child: Child;
  lessonsThisWeek: number;
  minutesLearned: number;
  streakDays: number;
  recentCompletions: RecentCompletion[];
};

type Props = {
  childrenData: ChildWithProgress[];
};

export function DashboardChildrenSection({ childrenData }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">Hồ sơ bé</h2>
          <p className="mt-1 text-sm text-slate-500">Tổng quan tiến độ học trong tuần và truy cập nhanh vào bài học.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {childrenData.length} hồ sơ đang hoạt động
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {childrenData.map(({ child, lessonsThisWeek, minutesLearned, streakDays, recentCompletions }) => (
          <DashboardChildCard
            key={child.id}
            child={child}
            lessonsThisWeek={lessonsThisWeek}
            minutesLearned={minutesLearned}
            streakDays={streakDays}
            weeklyGoal={5}
            recentCompletions={recentCompletions}
          />
        ))}
        {childrenData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
            Chưa có hồ sơ bé nào. Hãy thêm hồ sơ để bắt đầu hành trình học tập.
          </div>
        ) : null}
      </div>
    </section>
  );
}
