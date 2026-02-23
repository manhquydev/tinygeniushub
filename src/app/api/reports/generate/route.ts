import { NotificationType } from "@prisma/client";
import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createNotification, resolveUserIdForParent } from "@/modules/platform/notification-service";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import { generateWeeklyReportsForParent } from "@/modules/reports/weekly-report-service";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const [ipPolicy, parentPolicy] = await Promise.all([
      getRateLimitPolicy("reports.generate.ip"),
      getRateLimitPolicy("reports.generate.parent"),
    ]);
    const ip = getRequestIp(request);
    const ipLimit = await enforceRateLimit({
      key: `reports:generate:ip:${ip}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipLimit.allowed) {
      return fail("Too many report generation requests. Please retry later.", 429, {
        retryAfterMs: ipLimit.retryAfterMs,
      });
    }

    const parentLimit = await enforceRateLimit({
      key: `reports:generate:parent:${buildRateLimitIdentity(parent.id)}`,
      limit: parentPolicy.limit,
      windowMs: parentPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!parentLimit.allowed) {
      return fail("Too many report generation requests. Please retry later.", 429, {
        retryAfterMs: parentLimit.retryAfterMs,
      });
    }

    const reports = await generateWeeklyReportsForParent(parent.id);
    const userId = await resolveUserIdForParent({
      parentId: parent.id,
      parentEmail: parent.email,
    });

    if (userId && reports.length > 0) {
      const childIds = reports.map((report) => report.childId);
      const childProfiles = await prisma.childProfile.findMany({
        where: {
          id: {
            in: childIds,
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
            title: "B\u00e1o c\u00e1o tu\u1ea7n \u0111\u00e3 s\u1eb5n s\u00e0ng",
            message: `B\u00e1o c\u00e1o tu\u1ea7n c\u1ee7a ${childNameById.get(report.childId) ?? "b\u00e9"} \u0111\u00e3 s\u1eb5n s\u00e0ng!`,
            href: "/parent/reports",
          }),
        ),
      );
    }

    return ok({ reports });
  } catch (error) {
    return handleRouteError(error);
  }
}
