import { NotificationType, SubscriptionStatus } from "@prisma/client";
import { isCronRequestAuthorized } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { createNotification, resolveUserIdForParent } from "@/modules/platform/notification-service";
import { generateWeeklyReportsForParent, getWeeklyWindow } from "@/modules/reports/weekly-report-service";
import type { NextRequest } from "next/server";

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE_STANDARD,
  SubscriptionStatus.ACTIVE_FAMILYPLUS,
  SubscriptionStatus.GRACE,
  SubscriptionStatus.CANCELED_AT_PERIOD_END,
];

export async function GET(request: NextRequest) {
  try {
    if (!isCronRequestAuthorized(request)) {
      return fail("Unauthorized", 401);
    }

    const { weekStart, weekEnd } = getWeeklyWindow();

    // A subscription is treated as active for this report cycle when its billing period overlaps this week.
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: {
          in: ACTIVE_SUBSCRIPTION_STATUSES,
        },
        currentPeriodStart: {
          lte: weekEnd,
        },
        currentPeriodEnd: {
          gte: weekStart,
        },
      },
      select: {
        parentId: true,
        parent: {
          select: {
            email: true,
          },
        },
      },
    });

    let generatedReports = 0;
    let notificationsCreated = 0;

    for (const subscription of subscriptions) {
      const reports = await generateWeeklyReportsForParent(subscription.parentId);
      generatedReports += reports.length;

      if (reports.length === 0) {
        continue;
      }

      const userId = await resolveUserIdForParent({
        parentId: subscription.parentId,
        parentEmail: subscription.parent.email,
      });
      if (!userId) {
        continue;
      }

      const childProfiles = await prisma.childProfile.findMany({
        where: {
          id: {
            in: reports.map((report) => report.childId),
          },
        },
        select: {
          id: true,
          nickname: true,
        },
      });
      const childNameById = childProfiles.reduce<Map<string, string>>((acc, child) => {
        acc.set(child.id, child.nickname);
        return acc;
      }, new Map());

      await Promise.all(
        reports.map((report) =>
          createNotification(userId, {
            type: NotificationType.REPORT,
            title: `${childNameById.get(report.childId) ?? "Your child"}'s weekly report is ready!`,
            message: "You can view detailed learning progress now.",
            href: "/parent/reports",
          }),
        ),
      );
      notificationsCreated += reports.length;
    }

    return ok({
      processedParents: subscriptions.length,
      generatedReports,
      notificationsCreated,
      weekStart,
      weekEnd,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
