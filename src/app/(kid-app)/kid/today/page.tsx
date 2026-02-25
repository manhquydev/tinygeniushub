import { KidMissionPanel } from "@/components/kid-mission-panel";
import { Mascot } from "@/components/mascot";
import { SpaceBackground } from "@/components/space-background";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { getTodayMission } from "@/modules/content/service";

interface KidTodayPageProps {
  searchParams?: Promise<{ childId?: string | string[] }> | { childId?: string | string[] };
}

export default async function KidTodayPage({ searchParams }: KidTodayPageProps) {
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
    return (
      <section className="kid-empty-state">
        <Mascot variant="duo" state="thinking" actionProp="reading" size={210} motionLevel="soft" pauseWhenOffscreen />
        <h2>{"Ch\u01b0a c\u00f3 g\u00ec \u1edf \u0111\u00e2y c\u1ea3..."}</h2>
        <h1>{"Ch\u1ebf \u0111\u1ed9 h\u1ecdc t\u1eadp ch\u01b0a s\u1eb5n s\u00e0ng"}</h1>
        <p>{"H\u00e3y t\u1ea1o \u00edt nh\u1ea5t m\u1ed9t h\u1ed3 s\u01a1 b\u00e9 trong khu v\u1ef1c Ph\u1ee5 huynh tr\u01b0\u1edbc khi v\u00e0o h\u00e0nh tr\u00ecnh."}</p>
      </section>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const queryChildId = Array.isArray(resolvedSearchParams?.childId)
    ? resolvedSearchParams?.childId[0]
    : resolvedSearchParams?.childId;

  const initialChild = children.find((child) => child.id === queryChildId) ?? children[0];
  const initialLessons = await getTodayMission({
    parentId: parent.id,
    childId: initialChild.id,
    subscriptionStatus: parent.subscription?.status,
  });

  return (
    <div className="kid-today-scene">
      <SpaceBackground className="kid-today-space" />
      <KidMissionPanel
        childrenProfiles={children}
        initialChildId={initialChild.id}
        initialLessons={initialLessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          objective: lesson.objective,
          estimatedMinutes: lesson.estimatedMinutes,
          videoSource: lesson.videoSource,
          bunnyVideoId: lesson.bunnyVideoId ?? null,
          videoStatus: lesson.videoStatus,
        }))}
      />
    </div>
  );
}


