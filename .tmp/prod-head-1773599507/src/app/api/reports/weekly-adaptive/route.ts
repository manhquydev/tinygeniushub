/**
 * GET /api/reports/weekly-adaptive?childId=...&weekStart=...
 * Returns enriched weekly report with adaptive skill data for a parent's child.
 */

import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { prisma } from "@/lib/db";
import { enrichWeeklyReport } from "@/modules/adaptive/weekly-report-enricher";
import { getWeeklyWindow } from "@/modules/reports/weekly-report-service";

export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    const weekStartParam = searchParams.get("weekStart");

    if (!childId) return fail("childId is required", 400);

    // Verify the child belongs to this parent
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: parent.id },
      select: { id: true, nickname: true },
    });
    if (!child) return fail("Child not found or access denied", 403);

    const { weekStart, weekEnd } = weekStartParam
      ? (() => {
          const ws = new Date(weekStartParam);
          const we = new Date(ws);
          we.setDate(we.getDate() + 6);
          we.setHours(23, 59, 59, 999);
          return { weekStart: ws, weekEnd: we };
        })()
      : getWeeklyWindow();

    const [weeklyReport, enrichedSkills] = await Promise.all([
      prisma.weeklyReport.findUnique({
        where: { childId_weekStart: { childId, weekStart } },
      }),
      enrichWeeklyReport(childId, weekStart, weekEnd),
    ]);

    return ok({
      child,
      weekStart,
      weekEnd,
      weeklyReport,
      enrichedSkills,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
