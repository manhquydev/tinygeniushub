import { redirect } from "next/navigation";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { KidSkyGardenScene } from "@/components/kid-sky-garden/KidSkyGardenScene";
import { mapLessonLikeToSkyGardenLesson } from "@/components/kid-sky-garden/mappers";
import type { SkyGardenProgressSnapshot } from "@/components/kid-sky-garden/types";
import { resolveCourseCoverImage } from "@/modules/courses/course-media";
import { resolveKidCourseAccess } from "@/modules/courses/kid-course-access";

interface KidCourseGardenPageProps {
  params: Promise<{ slug: string }>;
  searchParams?:
    | Promise<{ childId?: string | string[]; focusTierNo?: string | string[] }>
    | { childId?: string | string[]; focusTierNo?: string | string[] };
}

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function KidCourseGardenPage({
  params,
  searchParams,
}: KidCourseGardenPageProps) {
  const parent = await requireParent();
  const { slug } = await params;

  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true, dailyGoalMinutes: true },
  });

  if (children.length === 0) {
    redirect("/parent/dashboard");
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const queryChildId = readSingleParam(resolvedParams?.childId);
  const queryFocusTierNo = readSingleParam(resolvedParams?.focusTierNo);
  const parsedFocusTierNoRaw = Number.parseInt(queryFocusTierNo ?? "", 10);
  const initialFocusTierNo =
    Number.isFinite(parsedFocusTierNoRaw) && parsedFocusTierNoRaw > 0
      ? parsedFocusTierNoRaw
      : null;
  const activeChild = children.find((child) => child.id === queryChildId) ?? children[0]!;

  const access = await resolveKidCourseAccess({
    parentId: parent.id,
    requestedSlug: slug,
  });

  if (!access.course || !access.hasAccess) {
    redirect(`/kid/courses?childId=${encodeURIComponent(activeChild.id)}`);
  }

  // Load course + lessons
  const course = await prisma.course.findUnique({
    where: { id: access.course.id },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImageUrl: true,
      lessons: {
        orderBy: { orderNo: "asc" },
        select: {
          orderNo: true,
          lesson: {
            select: {
              id: true,
              slug: true,
              title: true,
              estimatedMinutes: true,
              videoSource: true,
              bunnyVideoId: true,
              videoStatus: true,
              unit: {
                select: {
                  id: true,
                  title: true,
                  level: {
                    select: {
                      id: true,
                      title: true,
                      orderNo: true,
                      track: { select: { code: true } },
                    },
                  },
                },
              },
              completions: {
                where: { childId: activeChild.id },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    redirect(`/kid/courses?childId=${encodeURIComponent(activeChild.id)}`);
  }

  const lessons = course.lessons.map((courseLesson, index) => {
    const lesson = courseLesson.lesson;
    return mapLessonLikeToSkyGardenLesson(
      {
        id: lesson.id,
        title: lesson.title,
        estimatedMinutes: lesson.estimatedMinutes,
        trackCode: lesson.unit.level.track.code as "ENGLISH" | "MATH" | "HABIT",
        unitTitle: lesson.unit.title,
        videoSource: lesson.videoSource,
        bunnyVideoId: lesson.bunnyVideoId,
        videoStatus: lesson.videoStatus,
        isCompleted: lesson.completions.length > 0,
      },
      index,
    );
  });

  const completedCount = lessons.filter((lesson) => lesson.isCompleted).length;
  const totalCount = lessons.length;

  const activityToday = await prisma.lessonProgress.aggregate({
    where: {
      childId: activeChild.id,
      lastAccessedAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    _sum: { timeSpent: true },
  });

  const totalMinutesToday = Math.round((activityToday._sum.timeSpent ?? 0) / 60);

  const initialProgress: SkyGardenProgressSnapshot = {
    totalMinutesToday,
    dailyGoalMinutes: activeChild.dailyGoalMinutes,
    reached:
      activeChild.dailyGoalMinutes > 0 && totalMinutesToday >= activeChild.dailyGoalMinutes,
    streakDays: 0,
    completedLessons: completedCount,
    totalLessons: totalCount,
  };


  return (
    <KidSkyGardenScene
      childrenProfiles={children.map((child) => ({
        id: child.id,
        nickname: child.nickname,
        dailyGoalMinutes: child.dailyGoalMinutes,
      }))}
      initialChildId={activeChild.id}
      initialLessons={lessons}
      initialProgress={initialProgress}
      mode="course"
      courseSlug={access.course.slug}
      courseTitle={course.title}
      courseDescription={course.description}
      courseCoverImageUrl={resolveCourseCoverImage(course.slug, course.coverImageUrl)}
      initialFocusTierNo={initialFocusTierNo}
    />
  );
}
