import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await params;

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId: id },
      orderBy: { enrolledAt: "desc" },
      include: {
        parent: { select: { email: true, displayName: true } },
      },
    });

    return ok({ enrollments });
  } catch (error) {
    return handleRouteError(error);
  }
}
