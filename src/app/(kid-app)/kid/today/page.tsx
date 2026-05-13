import { addDays, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { KidSkyGardenScene } from "@/components/kid-sky-garden/KidSkyGardenScene";
import { mapLessonLikeToSkyGardenLesson } from "@/components/kid-sky-garden/mappers";
import { KidMissionPanel } from "@/components/kid-mission-panel";
import { Mascot } from "@/components/mascot";
import { SpaceBackground } from "@/components/space-background";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { isKidSkyGardenMvpEnabled } from "@/lib/feature-flags";
import { getRealKidGardenMission } from "@/modules/content/service";

interface KidTodayPageProps {
  searchParams?:
    | Promise<{
        childId?: string | string[];
        seedCourseId?: string | string[];
        seedCourseTitle?: string | string[];
      }>
    | {
        childId?: string | string[];
        seedCourseId?: string | string[];
        seedCourseTitle?: string | string[];
      };
}

const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

function getVietnamTodayBounds(referenceDate = new Date()) {
  const zonedNow = toZonedTime(referenceDate, VIETNAM_TIMEZONE);
  const zonedStartOfToday = startOfDay(zonedNow);
  const zonedStartOfTomorrow = addDays(zonedStartOfToday, 1);

  return {
    startOfToday: fromZonedTime(zonedStartOfToday, VIETNAM_TIMEZONE),
    startOfTomorrow: fromZonedTime(zonedStartOfTomorrow, VIETNAM_TIMEZONE),
  };
}

function readSingleQueryParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function KidTodayPage({ searchParams }: KidTodayPageProps) {
  const parent = await requireParent();
  const useSkyGardenMvp = await isKidSkyGardenMvpEnabled();

  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nickname: true,
      dailyGoalMinutes: true,
    },
  });

  if (children.length === 0) {
    return (
      <section className="kid-empty-state">
        <Mascot variant="duo" state="thinking" actionProp="reading" size={210} motionLevel="soft" pauseWhenOffscreen />
        <h2>Nothing here yet...</h2>
        <h1>Learning mode is not ready</h1>
        <p>Create at least one child profile in the parent area before starting the journey.</p>
      </section>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const queryChildId = readSingleQueryParam(resolvedSearchParams?.childId);
  const seedCourseId = readSingleQueryParam(resolvedSearchParams?.seedCourseId);
  const seedCourseTitle = readSingleQueryParam(resolvedSearchParams?.seedCourseTitle);

  const initialChild = children.find((child) => child.id === queryChildId) ?? children[0]!;
  const initialLessons = await getRealKidGardenMission({
    parentId: parent.id,
    childId: initialChild.id,
  });

  if (useSkyGardenMvp) {
    const { startOfToday, startOfTomorrow } = getVietnamTodayBounds();
    const [streakAggregate, minutesAggregate] = await Promise.all([
      prisma.progressState.aggregate({
        where: { childId: initialChild.id },
        _max: { streakCount: true },
      }),
      prisma.lessonCompletion.aggregate({
        where: {
          childId: initialChild.id,
          completedAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
        _sum: {
          minutesLearned: true,
        },
      }),
    ]);

    const totalMinutesToday = minutesAggregate._sum.minutesLearned ?? 0;
    const dailyGoalMinutes = initialChild.dailyGoalMinutes;

    return (
      <KidSkyGardenScene
        childrenProfiles={children.map((child) => ({
          id: child.id,
          nickname: child.nickname,
          dailyGoalMinutes: child.dailyGoalMinutes,
        }))}
        initialChildId={initialChild.id}
        initialLessons={initialLessons.map((lesson, index) => mapLessonLikeToSkyGardenLesson(lesson, index))}
        initialProgress={{
          dailyGoalMinutes,
          totalMinutesToday,
          reached: dailyGoalMinutes > 0 && totalMinutesToday >= dailyGoalMinutes,
          streakDays: streakAggregate._max.streakCount ?? 0,
        }}
        initialSeedCourse={
          seedCourseId && seedCourseTitle
            ? {
                id: seedCourseId,
                title: seedCourseTitle,
              }
            : null
        }
      />
    );
  }

  return (
    <div className="kid-today-scene">
      <SpaceBackground className="kid-today-space" />
      <KidMissionPanel
        childrenProfiles={children.map((child) => ({
          id: child.id,
          nickname: child.nickname,
        }))}
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
