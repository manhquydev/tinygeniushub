import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generateClassReport } from "@/modules/organizations/class-report-service";

export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const orgId = request.nextUrl.searchParams.get("orgId");
    if (!orgId) return fail("orgId is required", 400);

    // Verify requester is TEACHER_ADMIN of this org
    const membership = await prisma.organizationMember.findFirst({
      where: { parentId: parent.id, organizationId: orgId, role: "TEACHER_ADMIN" },
    });
    if (!membership) return fail("Forbidden", 403);

    const pdfBytes = await generateClassReport(orgId, parent.id);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="class-report-${orgId}.pdf"`,
        "Content-Length": String(pdfBytes.byteLength),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
