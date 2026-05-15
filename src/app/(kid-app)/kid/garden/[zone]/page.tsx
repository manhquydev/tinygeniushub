import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { getGardenLessons, filterLessonsBySubject } from "@/components/cloud-garden/use-garden-lessons";
import { GardenMascotGuide } from "@/components/cloud-garden/mascot-guide/GardenMascotGuide";
import { LessonBranch } from "@/components/cloud-garden/lesson-zone/LessonBranch";
import type { LessonSubject } from "@/components/cloud-garden/lesson-zone/LessonCard";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

/**
 * /kid/garden/[zone] — Lesson Zone (Branch View)
 *
 * Server Component: fetches garden lesson data for the selected zone
 * and renders the LessonBranch client component.
 *
 * Params:
 *   zone: "math" | "phonics" | "art" | "music" | "story"
 */

const VALID_ZONES: LessonSubject[] = ["math", "phonics", "art", "music", "story"];

interface ZonePageProps {
  params: Promise<{ zone: string }>;
}

export default async function KidGardenZonePage({ params }: ZonePageProps) {
  const { zone } = await params;
  const locale = resolveAppLocale(await getLocale());
  const zoneKey = zone as LessonSubject;
  const zoneTitle = translate(`kid.garden.zones.${zoneKey}`, undefined, locale);

  // Validate zone param
  if (!VALID_ZONES.includes(zone as LessonSubject)) {
    redirect("/kid/garden");
  }

  const subject = zone as LessonSubject;
  const parent = await requireParent();

  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true },
  });

  if (children.length === 0) {
    redirect("/parent/dashboard");
  }

  const firstChild = children[0]!;

  const { lessons, completedCount, todayCount } = await getGardenLessons(
    {
      parentId: parent.id,
      childId: firstChild.id,
      subscriptionStatus: parent.subscription?.status,
    },
  );

  // Filter to only lessons for this zone's subject
  const zoneLessons = filterLessonsBySubject(lessons, subject);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
      }}
    >
      <LessonBranch
        subject={subject}
        zoneTitle={zoneTitle}
        lessons={zoneLessons}
        streak={0}
        onSelectLesson={undefined}  // client navigation handled via router in client wrapper
        onBack={undefined}
      />
      {/* Mascot guide — zone-aware context */}
      <GardenMascotGuide
        context={`zone-${subject}` as `zone-${typeof subject}`}
        streak={0}
        lessonsDone={completedCount}
        lessonsTotal={todayCount}
      />
    </div>
  );
}

/**
 * Generate static params for all valid zones (optional optimization).
 * This allows Next.js to pre-render these pages if using static export.
 */
export function generateStaticParams() {
  return VALID_ZONES.map((zone) => ({ zone }));
}
