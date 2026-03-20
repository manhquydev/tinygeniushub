/**
 * use-garden-lessons.ts
 * Data fetching hook for Cloud Garden — wraps getTodayMission output
 * into GardenLesson shape consumed by LessonBranch / LessonCard.
 *
 * SERVER-SIDE ONLY (no "use client" — called from Server Components / page.tsx)
 *
 * TrackCode → GardenZone mapping:
 *   ENGLISH → "phonics"
 *   MATH    → "math"
 *   (future: ART, MUSIC, STORY as tracks are added)
 */

import type { LessonCardState, LessonSubject } from "@/components/cloud-garden/lesson-zone/LessonCard";
import type { LessonItem } from "@/components/cloud-garden/lesson-zone/LessonBranch";
import { getTodayMission } from "@/modules/content/service";

type GetTodayMissionResult = Awaited<ReturnType<typeof getTodayMission>>;
type MissionLesson = GetTodayMissionResult[number];

/** Map Prisma TrackCode → LessonSubject used by cloud-garden */
function trackCodeToSubject(trackCode: string): LessonSubject {
  switch (trackCode) {
    case "ENGLISH": return "phonics";
    case "MATH":    return "math";
    case "ART":     return "art";
    case "MUSIC":   return "music";
    case "STORY":   return "story";
    default:        return "phonics";
  }
}

/** Derive LessonCardState from lesson data */
function deriveCardState(lesson: MissionLesson, isToday: boolean): LessonCardState {
  if (lesson.isCompleted) return "completed";
  if (isToday)            return "today";
  return "available";
}

/** Computed lesson shape for Cloud Garden components */
export interface GardenLesson extends LessonItem {
  subject: LessonSubject;
  lessonSlug: string;
}

interface UseGardenLessonsOutput {
  lessons: GardenLesson[];
  todayCount: number;
  completedCount: number;
}

/**
 * Fetch and transform today's mission into GardenLesson[].
 *
 * @param input - same as getTodayMission
 * @param todayLessonId - optional: which lesson to mark as "today" (e.g. first incomplete)
 */
export async function getGardenLessons(
  input: Parameters<typeof getTodayMission>[0],
  todayLessonId?: string | null,
): Promise<UseGardenLessonsOutput> {
  const raw = await getTodayMission(input);

  // Determine "today" lesson: provided ID, or first non-completed lesson
  const todayId =
    todayLessonId ?? raw.find((l) => !l.isCompleted)?.id ?? null;

  const lessons: GardenLesson[] = raw.map((lesson) => ({
    id:               lesson.id,
    lessonSlug:       lesson.slug,
    title:            lesson.title,
    subject:          trackCodeToSubject(lesson.trackCode),
    estimatedMinutes: lesson.estimatedMinutes ?? undefined,
    completedCount:   lesson.isCompleted ? 1 : 0,
    totalCount:       1,
    state:            deriveCardState(lesson, lesson.id === todayId),
  }));

  return {
    lessons,
    todayCount:    raw.length,
    completedCount: raw.filter((l) => l.isCompleted).length,
  };
}

/** Filter lessons by subject zone */
export function filterLessonsBySubject(
  lessons: GardenLesson[],
  subject: LessonSubject,
): GardenLesson[] {
  return lessons.filter((l) => l.subject === subject);
}
