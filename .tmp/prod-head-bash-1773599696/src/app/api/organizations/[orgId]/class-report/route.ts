import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { generateClassReport } from "@/modules/organizations/class-report-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const { orgId } = await params;
    const pdfBytes = await generateClassReport(orgId, parent.id);

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="class-report-${orgId}.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
