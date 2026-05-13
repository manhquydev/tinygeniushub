/**
 * Skill Detail page for a specific skill of a child.
 * Route: /parent/dashboard/[childId]/skills/[skillId]
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { getSkillDetail } from "@/modules/adaptive/skill-map-service";
import { SkillDetailCard } from "@/components/skills/skill-detail-card";

interface PageProps {
  params: Promise<{ childId: string; skillId: string }>;
}

export default async function SkillDetailPage({ params }: PageProps) {
  const parent = await requireParent();
  const { childId, skillId } = await params;

  const child = await prisma.childProfile.findFirst({
    where: { id: childId, parentId: parent.id },
    select: { id: true, nickname: true },
  });
  if (!child) notFound();

  const detail = await getSkillDetail(childId, skillId);
  if (!detail) notFound();

  // Serialize dates for client components
  const serializedDetail = {
    ...detail,
    nextReview: detail.nextReview ? detail.nextReview.toISOString() : null,
  };

  return (
    <div className="page-stack">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
        <Link href="/parent/dashboard" className="hover:text-slate-600 transition-colors">Overview</Link>
        <span className="text-slate-300">/</span>
        <Link href={`/parent/dashboard/${childId}/skills`} className="hover:text-slate-600 transition-colors">
          Skill map
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500 font-medium truncate max-w-[120px]">{detail.skill.nameVi}</span>
      </div>

      <SkillDetailCard
        skill={serializedDetail.skill}
        mastery={serializedDetail.mastery}
        recentAttempts={serializedDetail.recentAttempts}
        nextReview={serializedDetail.nextReview}
        trend={serializedDetail.trend}
        prerequisites={serializedDetail.prerequisites}
      />

      {/* CTA */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-center">
        <p className="text-sm text-indigo-700 font-medium mb-2">Ready for more practice?</p>
        <Link
          href={`/parent/dashboard`}
          className="inline-block rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Go to school now
        </Link>
      </div>
    </div>
  );
}
