import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { resolveUserIdForParent } from "@/modules/platform/notification-service";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const userId = await resolveUserIdForParent({
      parentId: parent.id,
      parentEmail: parent.email,
    });
    if (!userId) {
      return fail("Unauthorized", 401);
    }

    const { id } = await params;
    if (!id) {
      return fail("Notification id is required", 400);
    }

    const updated = await prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        read: true,
      },
    });

    if (updated.count === 0) {
      return fail("Notification not found", 404);
    }

    return ok({
      id,
      read: true,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

