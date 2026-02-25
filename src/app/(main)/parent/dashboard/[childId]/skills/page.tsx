/**
 * Skill Map Overview page for a specific child.
 * Shows skills grouped by domain with mastery progress bars.
 * Route: /parent/dashboard/[childId]/skills
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { getSkillMap, getWeeklySummary } from "@/modules/adaptive/skill-map-service";
import { SkillMapGrid } from "@/components/skills/skill-map-grid";
import { SkillWeeklyInsight } from "@/components/skills/skill-weekly-insight";
import { AdaptiveLearningToggle } from "@/components/skills/adaptive-learning-toggle";

interface PageProps {
  params: Promise<{ childId: string }>;
}

export default async function SkillMapPage({ params }: PageProps) {
  const parent = await requireParent();
  const { childId } = await params;

  const child = await prisma.childProfile.findFirst({
    where: { id: childId, parentId: parent.id },
    select: { id: true, nickname: true, adaptiveEnabled: true },
  });
  if (!child) notFound();

  const [mathMap, englishMap, weeklySummary] = await Promise.all([
    getSkillMap(childId, "MATH"),
    getSkillMap(childId, "ENGLISH_PHONICS"),
    getWeeklySummary(childId),
  ]);

  const serializedSummary = {
    ...weeklySummary,
    upcomingReviews: weeklySummary.upcomingReviews.map((r) => ({
      ...r,
      scheduledAt: r.scheduledAt.toISOString(),
    })),
  };

  return (
    <div className="page-stack">
      {/* Page header */}
      <section className="rounded-3xl border border-slate-200/75 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/parent/dashboard" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Tổng quan
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-500 font-medium">{child.nickname}</span>
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-3xl">
          Bản đồ kỹ năng
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi tiến độ học tập của <strong>{child.nickname}</strong> theo từng kỹ năng
        </p>
      </section>

      {/* Weekly insight */}
      <SkillWeeklyInsight childName={child.nickname} summary={serializedSummary} />

      {/* Adaptive toggle */}
      <AdaptiveLearningToggle childId={childId} initialEnabled={child.adaptiveEnabled} />

      {/* MATH skills */}
      {mathMap.totalSkills > 0 && (
        <SkillMapGrid
          childId={childId}
          domain="MATH"
          overallProgress={mathMap.overallProgress}
          masteredCount={mathMap.masteredCount}
          totalSkills={mathMap.totalSkills}
          skills={mathMap.skills}
        />
      )}

      {/* English Phonics skills */}
      {englishMap.totalSkills > 0 && (
        <SkillMapGrid
          childId={childId}
          domain="ENGLISH_PHONICS"
          overallProgress={englishMap.overallProgress}
          masteredCount={englishMap.masteredCount}
          totalSkills={englishMap.totalSkills}
          skills={englishMap.skills}
        />
      )}

      {/* Empty state if no skills in DB yet */}
      {mathMap.totalSkills === 0 && englishMap.totalSkills === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-2xl mb-2">🗺️</p>
          <p className="font-semibold text-slate-700 mb-1">Bản đồ kỹ năng chưa sẵn sàng</p>
          <p className="text-sm text-slate-400">Bắt đầu làm bài kiểm tra đầu vào để xem bản đồ kỹ năng của bé!</p>
        </div>
      )}
    </div>
  );
}
