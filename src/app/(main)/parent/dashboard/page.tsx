import { Award, BookOpenCheck, CreditCard, Users } from "lucide-react";
import { DailyActivityFeed } from "@/components/daily-activity-feed";
import { MascotEcosystemShowcase } from "@/components/mascot-ecosystem-showcase";
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
function formatSubscriptionStatus(s: string | null | undefined) {
  if (!s) return "Trialing";
  return s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
function getSubscriptionProgress(s: string | null | undefined) {
  switch (s) { case "ACTIVE": return 100; case "TRIALING": return 78; case "PAST_DUE": return 35; case "CANCELED": return 20; default: return 60; }
}

export default async function ParentDashboardPage() {
  const parent = await requireParent();

  const [children, reports, completionCount, subscription, referral, latestCompletion, recentCompletions] =
    await Promise.all([
      prisma.childProfile.findMany({ where: { parentId: parent.id }, orderBy: { createdAt: "asc" }, select: { id: true, nickname: true, adaptiveEnabled: true } }),
      prisma.weeklyReport.findMany({ where: { child: { parentId: parent.id } }, orderBy: { generatedAt: "desc" }, take: 5, include: { child: { select: { id: true, nickname: true } } } }),
      prisma.lessonCompletion.count({ where: { child: { parentId: parent.id } } }),
      prisma.subscription.findUnique({ where: { parentId: parent.id }, select: { childProfileLimit: true, status: true } }),
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

  const childLimit = subscription?.childProfileLimit ?? 3;
  const completionGoal = Math.max(12, children.length * 6);
  const reportsGoal = Math.max(1, children.length);
  const latestReportByChild = reports.reduce<Map<string, (typeof reports)[number]>>((acc, r) => { if (!acc.has(r.child.id)) acc.set(r.child.id, r); return acc; }, new Map());

  const metricCards: DashboardMetric[] = [
    { id: "children", label: "Số hồ sơ bé", value: String(children.length), hint: `${children.length}/${childLimit} hồ sơ`, progress: clampPercent((children.length / childLimit) * 100), toneClass: "bg-teal-500/12 text-teal-700", progressClass: "from-teal-500 to-cyan-500", icon: Users },
    { id: "lessons", label: "Bài đã hoàn thành", value: String(completionCount), hint: `Mục tiêu: ${completionGoal} bài`, progress: clampPercent((completionCount / completionGoal) * 100), toneClass: "bg-amber-500/12 text-amber-700", progressClass: "from-amber-400 to-orange-500", icon: Award },
    { id: "reports", label: "Báo cáo tuần", value: String(reports.length), hint: `Mục tiêu: ${reportsGoal} báo cáo`, progress: clampPercent((reports.length / reportsGoal) * 100), toneClass: "bg-sky-500/12 text-sky-700", progressClass: "from-sky-500 to-blue-500", icon: BookOpenCheck },
    { id: "subscription", label: "Trạng thái gói", value: formatSubscriptionStatus(subscription?.status), hint: "Cập nhật realtime", progress: getSubscriptionProgress(subscription?.status), toneClass: "bg-violet-500/12 text-violet-700", progressClass: "from-violet-500 to-indigo-500", icon: CreditCard },
  ];

  const childrenData = children.map((child) => {
    const report = latestReportByChild.get(child.id);
    return { child, lessonsThisWeek: report?.lessonsCompleted ?? 0, minutesLearned: report?.minutesLearned ?? 0, streakDays: report?.streakDays ?? 0, recentCompletions: completionsByChild.get(child.id) ?? [] };
  });

  return (
    <div className="page-stack">
      <DashboardHeroSection
        parentDisplayName={parent.displayName ?? parent.email}
        heroMessage={hasRecentCompletion ? "Xin chúc mừng! Bé vừa hoàn thành một chặng học mới." : "Xin chào Ba Mẹ! Các bạn nhỏ đang học rất tốt mỗi ngày."}
        hasRecentCompletion={hasRecentCompletion}
      />

      <section className="rounded-3xl border border-white/75 bg-white/75 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
        <MascotEcosystemShowcase context={{ surface: "parent-dashboard", hourOfDay: new Date().getHours(), hasRecentCompletion, childrenCount: children.length, reportsCount: reports.length, paidReferrals: referral.paidReferrals, rewardedReferrals: referral.rewardedReferrals, subscriptionStatus: subscription?.status ?? null }} />
      </section>

      <DashboardMetricCards cards={metricCards} />
      <DailyActivityFeed childProfiles={children} />
      <DashboardShortcutsSection firstChildId={children[0]?.id ?? null} />
      <DashboardChildrenSection childrenData={childrenData} />
      <DashboardReferralSection referral={referral} />
      <DashboardReportsSection reports={reports} />
    </div>
  );
}
