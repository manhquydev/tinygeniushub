import { addDays, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { childId } = await params;
    if (!childId) {
      return fail("Child id is required", 400);
    }

    const child = await prisma.childProfile.findFirst({
      where: {
        id: childId,
        parentId: parent.id,
      },
      select: {
        id: true,
        nickname: true,
        dailyGoalMinutes: true,
      },
    });

    if (!child) {
      return fail("Child profile not found", 404);
    }

    const { startOfToday, startOfTomorrow } = getVietnamTodayBounds();
    const activities = await prisma.lessonCompletion.findMany({
      where: {
        childId,
        completedAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
      orderBy: {
        completedAt: "desc",
      },
      select: {
        id: true,
        minutesLearned: true,
        quizScore: true,
        completedAt: true,
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const totalMinutesToday = activities.reduce((total, activity) => total + activity.minutesLearned, 0);

    return ok({
      child,
      timezone: VIETNAM_TIMEZONE,
      dailyGoalMinutes: child.dailyGoalMinutes,
      totalMinutesToday,
      activities,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

