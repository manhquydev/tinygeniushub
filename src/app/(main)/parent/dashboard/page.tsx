import Link from "next/link";
import { Users, Award, Star, CreditCard, Gift, Heart } from "lucide-react";
import { ReferralClaimForm } from "@/components/referral-claim-form";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { getReferralSummaryForParentReadOnly } from "@/modules/referral/service";

export default async function ParentDashboardPage() {
  const parent = await requireParent();

  const [children, reports, completions, subscription, referral] = await Promise.all([
    prisma.childProfile.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        nickname: true,
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
  ]);
  const firstChildId = children[0]?.id ?? null;

  return (
    <div className="page-stack">
      <section className="card">
        <h1>Bảng điều khiển</h1>
        <p className="muted-text">Xin chào, {parent.displayName ?? parent.email}</p>
        <div className="metrics">
          <article className="metric" style={{ borderTop: "4px solid var(--brand-500)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <Users size={18} style={{ color: "var(--brand-500)" }} />
              <span className="muted-text">Số hồ sơ bé</span>
            </div>
            <strong>{children.length}</strong>
          </article>
          <article className="metric" style={{ borderTop: "4px solid var(--ink-700)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <Star size={18} style={{ color: "var(--ink-700)" }} />
              <span className="muted-text">Giới hạn hồ sơ</span>
            </div>
            <strong>{subscription?.childProfileLimit ?? 3}</strong>
          </article>
          <article className="metric" style={{ borderTop: "4px solid var(--warning-500)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <Award size={18} style={{ color: "var(--warning-500)" }} />
              <span className="muted-text">Bài đã hoàn thành</span>
            </div>
            <strong>{completions}</strong>
          </article>
          <article className="metric" style={{ borderTop: "4px solid #3b82f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <CreditCard size={18} style={{ color: "#3b82f6" }} />
              <span className="muted-text">Trạng thái gói</span>
            </div>
            <strong>{subscription?.status ?? "TRIALING"}</strong>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Đường tắt nhanh</h2>
        <div className="hero-actions">
          <Link href="/parent/children" className="solid-button">
            Quản lý hồ sơ bé
          </Link>
          <Link href={firstChildId ? `/kid/today?childId=${encodeURIComponent(firstChildId)}` : "/kid/today"} className="ghost-button">
            Vào bài học hôm nay
          </Link>
          <Link href="/parent/reports" className="ghost-button">
            Xem báo cáo tuần
          </Link>
        </div>
      </section>

      <section className="card">
        <h2>Hồ sơ bé</h2>
        <ul className="list-grid">
          {children.map((child) => (
            <li key={child.id} className="list-item">
              <strong>{child.nickname}</strong>
              <Link href={`/kid/today?childId=${encodeURIComponent(child.id)}`} className="ghost-button">
                Bắt đầu bài học
              </Link>
            </li>
          ))}
          {children.length === 0 ? <li className="list-item">Chưa có hồ sơ bé nào.</li> : null}
        </ul>
      </section>

      <section className="card">
        <h2>Mã giới thiệu</h2>
        <div className="metrics">
          <article className="metric">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <Heart size={18} style={{ color: "var(--ink-700)" }} />
              <span className="muted-text">Mã giới thiệu</span>
            </div>
            <strong>{referral.code ?? "Chưa tạo"}</strong>
          </article>
          <article className="metric">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <Users size={18} style={{ color: "var(--ink-700)" }} />
              <span className="muted-text">Tổng lượt giới thiệu</span>
            </div>
            <strong>{referral.totalReferrals}</strong>
          </article>
          <article className="metric">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <CreditCard size={18} style={{ color: "var(--ink-700)" }} />
              <span className="muted-text">Đã thanh toán</span>
            </div>
            <strong>{referral.paidReferrals}</strong>
          </article>
          <article className="metric">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <Gift size={18} style={{ color: "var(--ink-700)" }} />
              <span className="muted-text">Đã nhận thưởng</span>
            </div>
            <strong>{referral.rewardedReferrals}</strong>
          </article>
        </div>
      </section>

      <ReferralClaimForm ownCode={referral.code} />

      <section className="card">
        <h2>Báo cáo gần nhất</h2>
        <ul className="list-grid">
          {reports.map((report) => (
            <li key={report.id} className="list-item stack-item">
              <strong>{report.child.nickname}</strong>
              <span className="muted-text">
                {new Date(report.weekStart).toLocaleDateString("vi-VN")} -{" "}
                {new Date(report.weekEnd).toLocaleDateString("vi-VN")}
              </span>
              <span>
                {report.lessonsCompleted} lessons - {report.minutesLearned} phut - streak {report.streakDays}
              </span>
            </li>
          ))}
          {reports.length === 0 ? <li className="list-item">Chưa có báo cáo tuần nào.</li> : null}
        </ul>
      </section>
    </div>
  );
}
