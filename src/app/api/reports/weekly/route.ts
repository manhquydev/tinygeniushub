import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import {
  getLatestWeeklyReportsForChild,
  getLatestWeeklyReports,
} from "@/modules/reports/weekly-report-service";
import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const childId = request.nextUrl.searchParams.get("childId");
    if (childId) {
      const child = await prisma.childProfile.findFirst({
        where: {
          id: childId,
          parentId: parent.id,
        },
      });

      if (!child) {
        return fail("Child profile not found", 404);
      }

      const existingReports = await getLatestWeeklyReportsForChild(child.id, 12);
      return ok({ reports: existingReports });
    }

    const reports = await getLatestWeeklyReports(parent.id);
    return ok({ reports });
  } catch (error) {
    return handleRouteError(error);
  }
}
