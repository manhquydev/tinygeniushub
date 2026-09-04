import { prisma } from "@/lib/db";
import { PLATFORM_PASS_KEY } from "@/modules/entitlement/offering-types";

export type LessonCatalogSource = {
  trackCode?: string | null;
  levelId?: string | null;
  courseIds: string[];
};

export function trackCatalogKey(code: string) {
  return `track:${code}`;
}

export function courseCatalogKey(courseId: string) {
  return `course:${courseId}`;
}

export function courseLevelCatalogKey(courseId: string, levelId: string) {
  return `course:${courseId}:level:${levelId}`;
}

export function buildLessonCatalogKeys(source: LessonCatalogSource | null): string[] {
  if (!source) {
    return [];
  }

  const keys = [PLATFORM_PASS_KEY];
  if (source.trackCode) {
    keys.push(trackCatalogKey(source.trackCode));
  }

  for (const courseId of source.courseIds) {
    keys.push(courseCatalogKey(courseId));
    if (source.levelId) {
      keys.push(courseLevelCatalogKey(courseId, source.levelId));
    }
  }

  return keys;
}

export function ticketCoversLesson(ticketCatalogKey: string, lessonKeys: string[]): boolean {
  if (lessonKeys.length === 0) {
    return false;
  }

  if (ticketCatalogKey === PLATFORM_PASS_KEY) {
    return lessonKeys.includes(PLATFORM_PASS_KEY);
  }

  if (lessonKeys.includes(ticketCatalogKey)) {
    return true;
  }

  const isCourseProgramKey = ticketCatalogKey.startsWith("course:") && !ticketCatalogKey.includes(":level:");
  if (!isCourseProgramKey) {
    return false;
  }

  const levelPrefix = `${ticketCatalogKey}:level:`;
  return lessonKeys.some((key) => key.startsWith(levelPrefix));
}

export async function resolveLessonCatalogKeys(lessonId: string): Promise<string[]> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      unit: {
        select: {
          level: {
            select: {
              id: true,
              track: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      },
      courseItems: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!lesson) {
    return [];
  }

  return buildLessonCatalogKeys({
    trackCode: lesson.unit.level.track.code,
    levelId: lesson.unit.level.id,
    courseIds: lesson.courseItems.map((item) => item.courseId),
  });
}
