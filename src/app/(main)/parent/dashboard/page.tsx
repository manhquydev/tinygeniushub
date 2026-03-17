import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Award, BookOpenCheck, ChevronRight, CreditCard, Gift, Heart, Users } from "lucide-react";
import { DailyActivityFeed } from "@/components/daily-activity-feed";
import { MascotEcosystemShowcase } from "@/components/mascot-ecosystem-showcase";
import { Mascot } from "@/components/mascot";
import { ReferralClaimForm } from "@/components/referral-claim-form";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { getReferralSummaryForParentReadOnly } from "@/modules/referral/service";

type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  hint: string;
  progress: number;
  toneClass: string;
  progressClass: string;
  icon: LucideIcon;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatSubscriptionStatus(status: string | null | undefined) {
  if (!status) {
    return "Trialing";
  }

  return status.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSubscriptionProgress(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE":
      return 100;
    case "TRIALING":
      return 78;
    case "PAST_DUE":
      return 35;
    case "CANCELED":
      return 20;
    default:
      return 60;
  }
}

export default async function ParentDashboardPage() {
  const parent = await requireParent();

  const [children, reports, completions, subscription, referral, latestCompletion] = await Promise.all([
    prisma.childProfile.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        nickname: true,
        adaptiveEnabled: true,
      },
    }),
    prisma.weeklyReport.findMany({
      where: {
        child: {
          parentId: parent.id,
        },
      },
      orderBy: { generatedAt: "desc" },
      take: 5,
      include: {
        child: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    }),
    prisma.lessonCompletion.count({
      where: {
        child: {
          parentId: parent.id,
        },
      },
    }),
    prisma.subscription.findUnique({
      where: { parentId: parent.id },
      select: {
        childProfileLimit: true,
        status: true,
      },
    }),
    getReferralSummaryForParentReadOnly(parent.id),
    prisma.lessonCompletion.findFirst({
      where: {
        child: {
          parentId: parent.id,
        },
      },
      orderBy: { completedAt: "desc" },
      select: {
        completedAt: true,
      },
    }),
  ]);
  const firstChildId = children[0]?.id ?? null;
  const latestReportGeneratedAt = reports[0]?.generatedAt ?? null;
  const hasRecentCompletion =
    latestCompletion !== null && (latestReportGeneratedAt === null || latestCompletion.completedAt > latestReportGeneratedAt);
  const dashboardMascotState = hasRecentCompletion ? "celebrating" : "happy";
  const parentDisplayName = parent.displayName ?? parent.email;
  const childLimit = subscription?.childProfileLimit ?? 3;
  const subscriptionLabel = formatSubscriptionStatus(subscription?.status);
  const completionGoal = Math.max(12, children.length * 6);
  const reportsGoal = Math.max(1, children.length);
  const profileUsageProgress = clampPercent((children.length / childLimit) * 100);
  const completionProgress = clampPercent((completions / completionGoal) * 100);
  const reportProgress = clampPercent((reports.length / reportsGoal) * 100);
  const subscriptionProgress = getSubscriptionProgress(subscription?.status);
  const latestReportByChild = reports.reduce<Map<string, (typeof reports)[number]>>((acc, report) => {
    if (!acc.has(report.child.id)) {
      acc.set(report.child.id, report);
    }

    return acc;
  }, new Map());
  const heroMessage = hasRecentCompletion
    ? "Xin chúc mừng! Bé vừa hoàn thành một chặng học mới."
    : "Xin chào Ba Mẹ! Các bạn nhỏ đang học rất tốt mỗi ngày.";
  const metricCards: DashboardMetric[] = [
    {
      id: "children",
      label: "Số hồ sơ bé",
      value: String(children.length),
      hint: `${children.length}/${childLimit} hồ sơ`,
      progress: profileUsageProgress,
      toneClass: "bg-teal-500/12 text-teal-700",
      progressClass: "from-teal-500 to-cyan-500",
      icon: Users,
    },
    {
      id: "lessons",
      label: "Bài đã hoàn thành",
      value: String(completions),
      hint: `Mục tiêu: ${completionGoal} bài`,
      progress: completionProgress,
      toneClass: "bg-amber-500/12 text-amber-700",
      progressClass: "from-amber-400 to-orange-500",
      icon: Award,
    },
    {
      id: "reports",
      label: "Báo cáo tuần",
      value: String(reports.length),
      hint: `Mục tiêu: ${reportsGoal} báo cáo`,
      progress: reportProgress,
      toneClass: "bg-sky-500/12 text-sky-700",
      progressClass: "from-sky-500 to-blue-500",
      icon: BookOpenCheck,
    },
    {
      id: "subscription",
      label: "Trạng thái gói",
      value: subscriptionLabel,
      hint: "Cập nhật realtime",
      progress: subscriptionProgress,
      toneClass: "bg-violet-500/12 text-violet-700",
      progressClass: "from-violet-500 to-indigo-500",
      icon: CreditCard,
    },
  ];

  return (
    <div className="page-stack">
      <section className="relative isolate overflow-visible rounded-3xl border border-white/45 bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 p-6 shadow-[0_30px_64px_rgba(14,116,144,0.35)] sm:p-8 lg:p-10">
        <div
          aria-hidden
          className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_10%_12%,rgba(255,255,255,0.34)_0%,transparent_40%),radial-gradient(circle_at_82%_80%,rgba(14,165,233,0.34)_0%,transparent_44%),linear-gradient(125deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0)_42%)]"
        />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid max-w-[62ch] gap-3">
            <p className="inline-flex w-fit rounded-full border border-white/35 bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              Parent Dashboard
            </p>
            <h1 className="text-balance text-3xl font-black leading-[1.08] tracking-[-0.02em] text-white sm:text-[2.4rem]">
              Bảng điều khiển gia đình
            </h1>
            <p className="text-base font-semibold text-cyan-50 sm:text-lg">Xin chào, {parentDisplayName}</p>
            <p className="text-sm leading-relaxed text-sky-50/95 sm:text-base">{heroMessage}</p>
          </div>

          <div className="relative mx-auto flex w-full max-w-[270px] justify-center lg:mx-0 lg:-mb-16 lg:-mt-10 lg:max-w-[290px]">
            <div
              aria-hidden
              className="absolute bottom-5 h-44 w-44 rounded-full bg-cyan-100/45 blur-[58px] lg:bottom-10 lg:h-48 lg:w-48"
            />
            <Mascot
              variant="big"
              state={dashboardMascotState}
              actionProp={hasRecentCompletion ? "magic" : "none"}
              size={240}
              className="relative h-[220px] w-[220px] drop-shadow-[0_24px_44px_rgba(2,6,23,0.34)] sm:h-[240px] sm:w-[240px] lg:h-[260px] lg:w-[260px]"
              motionLevel="full"
              pauseWhenOffscreen
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/75 bg-white/75 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
        <MascotEcosystemShowcase
          context={{
            surface: "parent-dashboard",
            hourOfDay: new Date().getHours(),
            hasRecentCompletion,
            childrenCount: children.length,
            reportsCount: reports.length,
            paidReferrals: referral.paidReferrals,
            rewardedReferrals: referral.rewardedReferrals,
            subscriptionStatus: subscription?.status ?? null,
          }}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <article
            key={metric.id}
            className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${metric.toneClass}`}>
                <metric.icon size={20} />
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{metric.hint}</span>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">{metric.label}</p>
            <p className="mt-1 text-4xl font-extrabold tracking-[-0.02em] text-slate-900">{metric.value}</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <span
                className={`block h-full rounded-full bg-gradient-to-r ${metric.progressClass} transition-all duration-500`}
                style={{ width: `${metric.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">{metric.progress}% tiến độ mục tiêu</p>
          </article>
        ))}
      </section>

      <DailyActivityFeed childProfiles={children} />

      <section className="rounded-3xl border border-slate-200/80 bg-white px-5 py-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">Đường tắt nhanh</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/parent/children"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(13,148,136,0.3)] transition hover:-translate-y-0.5"
          >
            Quản lý hồ sơ bé
          </Link>
          <Link
            href={firstChildId ? `/kid/courses?childId=${encodeURIComponent(firstChildId)}` : "/kid/courses"}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
          >
            Vào khu học của bé
          </Link>
          <Link
            href="/parent/courses"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
          >
            Khoá học Premium
          </Link>
          <Link
            href="/parent/reports"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
          >
            Xem báo cáo tuần
          </Link>
          <Link
            href="/gift-code"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
          >
            Nhập mã quà tặng
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">Hồ sơ bé</h2>
            <p className="mt-1 text-sm text-slate-500">Tổng quan tiến độ học trong tuần và truy cập nhanh vào bài học.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {children.length} hồ sơ đang hoạt động
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          {children.map((child) => {
            const report = latestReportByChild.get(child.id);
            const weeklyGoal = 5;
            const lessonsThisWeek = report?.lessonsCompleted ?? 0;
            const minutesLearned = report?.minutesLearned ?? 0;
            const streakDays = report?.streakDays ?? 0;
            const progress = clampPercent((lessonsThisWeek / weeklyGoal) * 100);

            return (
              <article
                key={child.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-sky-100 text-xl font-black text-teal-700 shadow-inner">
                    {(child.nickname.trim().charAt(0) || "B").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black tracking-[-0.01em] text-slate-900">{child.nickname}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                      Tuần này: {lessonsThisWeek} bài • {minutesLearned} phút • chuỗi {streakDays} ngày
                    </p>
                    <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                      <span className="block h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{progress}% mục tiêu tuần</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {child.adaptiveEnabled ? (
                    <Link
                      href={`/parent/dashboard/${encodeURIComponent(child.id)}/skills`}
                      className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-indigo-50 px-4 text-sm font-bold text-indigo-700 ring-1 ring-indigo-200 transition hover:-translate-y-0.5"
                    >
                      Xem bản đồ kỹ năng
                    </Link>
                  ) : null}
                  <Link
                    href={`/kid/courses?childId=${encodeURIComponent(child.id)}`}
                    className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-white px-4 text-sm font-bold text-slate-700 ring-1 ring-slate-300 transition hover:-translate-y-0.5"
                  >
                    Vào khu học
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </article>
            );
          })}

          {children.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
              Chưa có hồ sơ bé nào. Hãy thêm hồ sơ để bắt đầu hành trình học tập.
            </div>
          ) : null}
        </div>
      </section>

      {referral.code ? (
        <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-[0_12px_28px_rgba(251,191,36,0.15)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Gift size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-[-0.01em] text-slate-900">Giới thiệu bạn bè — cùng nhận thưởng</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Mỗi gia đình bạn giới thiệu nhận <strong>ưu đãi chào mừng</strong>. Bạn nhận <strong>voucher thưởng</strong> sau khi họ thanh toán thành công.
                </p>
                <p className="mt-2 rounded-xl border border-amber-200 bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-amber-700 inline-block">
                  {referral.code}
                </p>
              </div>
            </div>
            <Link
              href="/referral"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-amber-500 px-5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(245,158,11,0.35)] transition hover:-translate-y-0.5 hover:bg-amber-600"
            >
              <Gift size={16} />
              Chia sẻ ngay
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">Mã giới thiệu</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Heart size={16} />
              <span className="text-sm font-semibold">Mã giới thiệu</span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-slate-900">{referral.code ?? "Chưa tạo"}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Users size={16} />
              <span className="text-sm font-semibold">Tổng lượt giới thiệu</span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-slate-900">{referral.totalReferrals}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <CreditCard size={16} />
              <span className="text-sm font-semibold">Đã thanh toán</span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-slate-900">{referral.paidReferrals}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Gift size={16} />
              <span className="text-sm font-semibold">Đã nhận thưởng</span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-slate-900">{referral.rewardedReferrals}</p>
          </article>
        </div>
      </section>

      <ReferralClaimForm ownCode={referral.code} />

      <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">Báo cáo gần nhất</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {reports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-base font-black text-slate-900">{report.child.nickname}</p>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(report.weekStart).toLocaleDateString("vi-VN")} -{" "}
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
    </div>
  );
}
