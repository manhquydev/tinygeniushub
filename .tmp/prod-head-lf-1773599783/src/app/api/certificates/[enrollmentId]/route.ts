import type { NextRequest } from "next/server";
import { fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { isParentAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { generateCertificate } from "@/modules/courses/certificate-service";
import { NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { enrollmentId } = await params;
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });

    if (!enrollment) {
      return fail("Enrollment not found", 404);
    }

    // Must be the enrolled parent or an admin
    if (!isParentAdmin(parent) && enrollment.parentId !== parent.id) {
      return fail("Access denied", 403);
    }

    if (!enrollment.completedAt) {
      return fail("Course not yet completed", 404);
    }

    // Generate PDF on-demand
    const pdfBytes = await generateCertificate({
      courseTitle: enrollment.course.title,
      completedAt: enrollment.completedAt,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${enrollmentId}.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
