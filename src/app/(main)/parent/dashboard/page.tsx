import { Award, BookOpenCheck, Users } from "lucide-react";
import { DailyActivityFeed } from "@/components/daily-activity-feed";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { getReferralSummaryForParentReadOnly } from "@/modules/referral/service";
import { DashboardMetricCards, type DashboardMetric } from "@/components/parent/dashboard-metric-cards";
import { DashboardHeroSection } from "@/components/parent/dashboard-hero-section";
import { DashboardChildrenSection } from "@/components/parent/dashboard-children-section";
import { DashboardShortcutsSection } from "@/components/parent/dashboard-shortcuts-section";
import { DashboardReferralSection } from "@/components/parent/dashboard-referral-section";
import { DashboardReportsSection } from "@/components/parent/dashboard-reports-section";

function clampPercent(v: number) { return Math.max(0, Math.min(100, Math.round(v))); }

export default async function ParentDashboardPage() {
  const parent = await requireParent();

  const [children, reports, completionCount, referral, latestCompletion, recentCompletions] =
    await Promise.all([
      prisma.childProfile.findMany({ where: { parentId: parent.id }, orderBy: { createdAt: "asc" }, select: { id: true, nickname: true, adaptiveEnabled: true } }),
      prisma.weeklyReport.findMany({ where: { child: { parentId: parent.id } }, orderBy: { generatedAt: "desc" }, take: 5, include: { child: { select: { id: true, nickname: true } } } }),
      prisma.lessonCompletion.count({ where: { child: { parentId: parent.id } } }),
      getReferralSummaryForParentReadOnly(parent.id),
      prisma.lessonCompletion.findFirst({ where: { child: { parentId: parent.id } }, orderBy: { completedAt: "desc" }, select: { completedAt: true } }),
      prisma.lessonCompletion.findMany({ where: { child: { parentId: parent.id } }, orderBy: { completedAt: "desc" }, take: 15, select: { childId: true, completedAt: true, lesson: { select: { title: true } } } }),
    ]);

  const latestReportGeneratedAt = reports[0]?.generatedAt ?? null;
  const hasRecentCompletion = latestCompletion !== null && (latestReportGeneratedAt === null || latestCompletion.completedAt > latestReportGeneratedAt);

  const completionsByChild = new Map<string, { title: string; completedAt: Date }[]>();
  for (const c of recentCompletions) {
    const arr = completionsByChild.get(c.childId) ?? [];
    if (arr.length < 3) arr.push({ title: c.lesson.title, completedAt: c.completedAt });
    completionsByChild.set(c.childId, arr);
  }

  const childLimit = 1;
  const completionGoal = Math.max(12, children.length * 6);
  const reportsGoal = Math.max(1, children.length);
  const latestReportByChild = reports.reduce<Map<string, (typeof reports)[number]>>((acc, r) => { if (!acc.has(r.child.id)) acc.set(r.child.id, r); return acc; }, new Map());

  const metricCards: DashboardMetric[] = [
    { id: "children", label: "Baby file number", value: String(children.length), hint: `${children.length}/${childLimit}file`, progress: clampPercent((children.length / childLimit) * 100), toneClass: "bg-teal-500/12 text-teal-700", progressClass: "from-teal-500 to-cyan-500", icon: Users },
    { id: "lessons", label: "Lesson completed", value: String(completionCount), hint: `Target:${completionGoal}post`, progress: clampPercent((completionCount / completionGoal) * 100), toneClass: "bg-amber-500/12 text-amber-700", progressClass: "from-amber-400 to-orange-500", icon: Award },
    { id: "reports", label: "Weekly report", value: String(reports.length), hint: `Target:${reportsGoal}report`, progress: clampPercent((reports.length / reportsGoal) * 100), toneClass: "bg-sky-500/12 text-sky-700", progressClass: "from-sky-500 to-blue-500", icon: BookOpenCheck },
  ];

  const childrenData = children.map((child) => {
    const report = latestReportByChild.get(child.id);
    return { child, lessonsThisWeek: report?.lessonsCompleted ?? 0, minutesLearned: report?.minutesLearned ?? 0, streakDays: report?.streakDays ?? 0, recentCompletions: completionsByChild.get(child.id) ?? [] };
  });

  return (
    <div className="page-stack">
      <DashboardHeroSection
        parentDisplayName={parent.displayName ?? parent.email}
        heroMessage={hasRecentCompletion ? "Congratulations! The child has just completed a new stage of learning." : "Hello Mom and Dad! The children are learning very well every day."}
        hasRecentCompletion={hasRecentCompletion}
      />

      <DashboardMetricCards cards={metricCards} />
      <DailyActivityFeed childProfiles={children} />
      <DashboardShortcutsSection firstChildId={children[0]?.id ?? null} />
      <DashboardChildrenSection childrenData={childrenData} />
      <DashboardReferralSection referral={referral} />
      <DashboardReportsSection reports={reports} />
    </div>
  );
}
