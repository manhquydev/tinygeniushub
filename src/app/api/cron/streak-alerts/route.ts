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

      const href = `/kid/today?childId=${encodeURIComponent(child.id)}`;
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
        title: `\u0110\u1eebng \u0111\u1ec3 ${child.nickname} m\u1ea5t chu\u1ed7i ${streakDays} ng\u00e0y! \u{1F525}`,
        message: `B\u00e9 ch\u01b0a h\u1ecdc h\u00f4m nay. Ch\u1ec9 c\u1ea7n 5 ph\u00fat l\u00e0 gi\u1eef \u0111\u01b0\u1ee3c chu\u1ed7i ${streakDays} ng\u00e0y li\u00ean ti\u1ebfp r\u1ed3i!`,
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
