import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import {
  getLatestWeeklyReports,
  getLatestWeeklyReportsForChild,
  getWeeklyTrend,
  type WeeklyTrend,
} from "@/modules/reports/weekly-report-service";
import type { NextRequest } from "next/server";

type ReportWithBaseMetrics = {
  id: string;
  childId: string;
  generatedAt: Date;
  lessonsCompleted: number;
  minutesLearned: number;
  streakDays: number;
};

function attachTrends<T extends ReportWithBaseMetrics>(reports: T[]): Array<T & { trend: WeeklyTrend }> {
  const trendByReportId = new Map<string, WeeklyTrend>();
  const reportsByChild = reports.reduce<Map<string, T[]>>((acc, report) => {
    const existing = acc.get(report.childId) ?? [];
    existing.push(report);
    acc.set(report.childId, existing);
    return acc;
  }, new Map());

  for (const [childId, childReports] of reportsByChild.entries()) {
    const sorted = [...childReports].sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index];
      const previous = sorted[index + 1] ?? null;
      trendByReportId.set(current.id, getWeeklyTrend(childId, current, previous));
    }
  }

  return reports.map((report) => ({
    ...report,
    trend: trendByReportId.get(report.id) ?? getWeeklyTrend(report.childId, report, null),
  }));
}

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
        select: {
          id: true,
        },
      });
      if (!child) {
        return fail("Child profile not found", 404);
      }

      const existingReports = await getLatestWeeklyReportsForChild(child.id, 12);
      return ok({ reports: attachTrends(existingReports) });
    }

    const reports = await getLatestWeeklyReports(parent.id);
    return ok({ reports: attachTrends(reports) });
  } catch (error) {
    return handleRouteError(error);
  }
}
