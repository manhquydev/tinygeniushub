import { addDays, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { NotificationType } from "@prisma/client";
import { isCronRequestAuthorized } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { createNotification, resolveUserIdForParent } from "@/modules/platform/notification-service";
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

export async function GET(request: NextRequest) {
  try {
    if (!isCronRequestAuthorized(request)) {
      return fail("Unauthorized", 401);
    }

    const { startOfToday, startOfTomorrow } = getVietnamTodayBounds();
    const children = await prisma.childProfile.findMany({
      where: {
        progressStates: {
          some: {
            streakCount: {
              gt: 0,
            },
          },
        },
        completions: {
          none: {
            completedAt: {
              gte: startOfToday,
              lt: startOfTomorrow,
            },
          },
        },
      },
      select: {
        id: true,
        nickname: true,
        parentId: true,
        parent: {
          select: {
            email: true,
          },
        },
        progressStates: {
          where: {
            streakCount: {
              gt: 0,
            },
          },
          select: {
            streakCount: true,
          },
        },
      },
    });

    let alertsCreated = 0;
    let duplicatesSkipped = 0;

    for (const child of children) {
      const streakDays = child.progressStates.reduce((max, progress) => Math.max(max, progress.streakCount), 0);
      if (streakDays <= 0) {
        continue;
      }

      const userId = await resolveUserIdForParent({
        parentId: child.parentId,
        parentEmail: child.parent.email,
      });
      if (!userId) {
        continue;
      }

      const href = `/kid/courses?childId=${encodeURIComponent(child.id)}`;
      const existingAlert = await prisma.notification.findFirst({
        where: {
          userId,
          type: NotificationType.TIP,
          href,
          createdAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
        select: {
          id: true,
        },
      });

      // We deduplicate by user + child deep-link + day to avoid repeated reminders from retries.
      if (existingAlert) {
        duplicatesSkipped += 1;
        continue;
      }

      await createNotification(userId, {
        type: NotificationType.TIP,
        title: `Help ${child.nickname} keep a ${streakDays}-day streak! \u{1F525}`,
        message: `${child.nickname} has not studied today. Five minutes is enough to keep the streak going.`,
        href,
      });
      alertsCreated += 1;
    }

    return ok({
      candidates: children.length,
      alertsCreated,
      duplicatesSkipped,
      timezone: VIETNAM_TIMEZONE,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
