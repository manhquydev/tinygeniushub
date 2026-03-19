import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { resolveKidCourseAccess } from "@/modules/courses/kid-course-access";

/**
 * GET /api/courses/[slug]/lessons?childId=xxx
 *
 * Returns the lessons for a specific course, filtered with completion status
 * for the given child. Response shape is compatible with /api/lessons/today
 * so KidSkyGardenScene can consume it using the same mapper.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return fail("childId is required", 400);
    }

    // Verify the child belongs to this parent
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: parent.id },
      select: { id: true },
    });

    if (!child) {
      return fail("Child not found", 404);
    }

    const { slug } = await params;
    const access = await resolveKidCourseAccess({
      parentId: parent.id,
      requestedSlug: slug,
    });

    if (!access.course) {
      return fail("Course not found", 404);
    }
    if (!access.hasAccess) {
      return fail("Not enrolled in this course", 403);
    }

    // Load course lessons with completion status for child
    const course = await prisma.course.findUnique({
      where: { id: access.course.id },
      select: {
        id: true,
        slug: true,
        title: true,
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
                parentScriptMarkdown: true,
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
                  where: { childId },
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
      return fail("Course not found", 404);
    }

    const journey = await prisma.childCourseJourney.findUnique({
      where: {
        childId_courseId: {
          childId,
          courseId: course.id,
        },
      },
      select: {
        status: true,
        currentTierNo: true,
        currentTierProgress: true,
      },
    });

    // Map to the same shape as /api/lessons/today lessons array
    const lessons = course.lessons.map((courseLesson) => {
      const lesson = courseLesson.lesson;
      return {
        id: lesson.id,
        title: lesson.title,
        estimatedMinutes: lesson.estimatedMinutes,
        parentScriptMarkdown: lesson.parentScriptMarkdown ?? null,
        trackCode: lesson.unit.level.track.code,
        unitTitle: lesson.unit.title,
        journeyTitle: lesson.unit.level.title,
        videoSource: lesson.videoSource,
        bunnyVideoId: lesson.bunnyVideoId,
        videoStatus: lesson.videoStatus,
        isCompleted: lesson.completions.length > 0,
      };
    });

    return ok({
      lessons,
      journey: journey
        ? {
            status: journey.status,
            currentTierNo: journey.currentTierNo,
            currentTierProgress: journey.currentTierProgress,
          }
        : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
