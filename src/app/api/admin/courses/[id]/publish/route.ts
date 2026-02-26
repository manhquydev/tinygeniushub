import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const { id } = await params;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return fail("Course not found", 404);
    }

    const updated = await prisma.course.update({
      where: { id },
      data: { isPublished: !course.isPublished },
    });

    return ok({ course: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}


