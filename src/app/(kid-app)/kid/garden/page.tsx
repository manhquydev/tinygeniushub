import { redirect } from "next/navigation";
import { BeanstalkJourney } from "@/components/beanstalk-garden/BeanstalkJourney";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { getJourneySnapshot, listJourneysForChild } from "@/modules/garden/journey-service";

interface KidGardenPageProps {
  searchParams?:
    | Promise<{
        childId?: string | string[];
        journeyId?: string | string[];
      }>
    | {
        childId?: string | string[];
        journeyId?: string | string[];
      };
}

function readSingleQueryParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function KidGardenPage({ searchParams }: KidGardenPageProps) {
  const parent = await requireParent();

  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nickname: true,
    },
  });

  if (children.length === 0) {
    redirect("/parent/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const queryChildId = readSingleQueryParam(resolvedSearchParams?.childId);
  const queryJourneyId = readSingleQueryParam(resolvedSearchParams?.journeyId);

  const activeChild = children.find((child) => child.id === queryChildId) ?? children[0]!;

  const journeys = await listJourneysForChild({
    parentId: parent.id,
    childId: activeChild.id,
  });

  const selectedJourney =
    (queryJourneyId ? journeys.find((journey) => journey.id === queryJourneyId) : null)
    ?? journeys[0]
    ?? null;

  const activeJourneyId = selectedJourney?.id ?? null;

  const activeSnapshot = activeJourneyId
    ? await getJourneySnapshot({
        parentId: parent.id,
        childId: activeChild.id,
        journeyId: activeJourneyId,
      })
    : null;

  const tiers = activeSnapshot?.tiers.map((tier) => ({
    tierNo: tier.tierNo,
    title: tier.title,
    lessonTotal: tier.lessonTotal,
    lessonCompleted: tier.lessonCompleted,
    isUnlocked: tier.isUnlocked,
    isCompleted: tier.isCompleted,
  })) ?? [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <BeanstalkJourney
        childrenProfiles={children.map((child) => ({
          id: child.id,
          nickname: child.nickname,
        }))}
        activeChildId={activeChild.id}
        journeys={journeys.map((journey) => ({
          id: journey.id,
          courseSlug: journey.courseSlug,
          courseTitle: journey.courseTitle,
          status: journey.status,
          seedName: journey.seedName,
          currentTierNo: journey.currentTierNo,
          currentTierProgress: journey.currentTierProgress,
          totalTiers: journey.totalTiers,
          completedTiers: journey.completedTiers,
          totalLessons: journey.totalLessons,
          completedLessons: journey.completedLessons,
        }))}
        activeJourneyId={activeJourneyId}
        activeJourneyCourseSlug={activeSnapshot?.course.slug ?? selectedJourney?.courseSlug ?? null}
        activeJourneyCourseTitle={activeSnapshot?.course.title ?? selectedJourney?.courseTitle ?? null}
        tiers={tiers}
      />
    </div>
  );
}
