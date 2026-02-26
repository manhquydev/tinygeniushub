import { notFound } from "next/navigation";
import { SkillProgressMapClient } from "@/components/skills/skill-progress-map-client";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";

interface SkillMapPageProps {
  params: Promise<{ childId: string }>;
}

export default async function SkillMapPage({ params }: SkillMapPageProps) {
  const parent = await requireParent();
  const { childId } = await params;

  const child = await prisma.childProfile.findFirst({
    where: { id: childId, parentId: parent.id },
    select: {
      id: true,
      nickname: true,
      adaptiveEnabled: true,
    },
  });

  if (!child) {
    notFound();
  }

  return (
    <SkillProgressMapClient
      childId={child.id}
      childName={child.nickname}
      initialAdaptiveEnabled={child.adaptiveEnabled}
    />
  );
}

