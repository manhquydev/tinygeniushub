import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { resolveUserIdForParent } from "@/modules/platform/notification-service";
import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const userId = await resolveUserIdForParent({
      parentId: parent.id,
      parentEmail: parent.email,
    });

    if (!userId) {
      return ok({ notifications: [] });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        href: true,
        read: true,
        createdAt: true,
      },
    });

    return ok({ notifications });
  } catch (error) {
    return handleRouteError(error);
  }
}

