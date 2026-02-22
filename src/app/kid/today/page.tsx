import { KidMissionPanel } from "@/components/kid-mission-panel";
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
      <section className="card">
        <h1>Chế độ học tập chưa sẵn sàng</h1>
        <p className="muted-text">Hãy tạo ít nhất một hồ sơ bé trong Phụ huynh / Hồ sơ bé.</p>
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
    <KidMissionPanel
      childrenProfiles={children}
      initialChildId={initialChild.id}
      initialLessons={initialLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        objective: lesson.objective,
        estimatedMinutes: lesson.estimatedMinutes,
        videoSource: lesson.videoSource,
      }))}
    />
  );
}
