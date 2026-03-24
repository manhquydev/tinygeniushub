import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { getAdminGa4Snapshot, type AdminGa4Snapshot } from "./admin-ga4-reporting-service";

const TRACKED_AUDIT_ACTIONS = [
  "course_checkout_started",
  "course_purchase_succeeded",
  "learning.lesson.video.watch.completed",
  "report_viewed",
  "report_shared",
  "level_change_request_created",
  "level_change_request_decided",
] as const;

type ActionCount = Record<(typeof TRACKED_AUDIT_ACTIONS)[number], number>;

export type AdminSoTDashboardSnapshot = {
  window: "7d";
  sqlAudit: {
    counts7d: ActionCount;
    counts30d: ActionCount;
    checkoutToPurchaseRate7d: number;
    latestAuditAt: string | null;
  };
  ga4: AdminGa4Snapshot;
};

function emptyActionCount(): ActionCount {
  return {
    course_checkout_started: 0,
    course_purchase_succeeded: 0,
    "learning.lesson.video.watch.completed": 0,
    report_viewed: 0,
    report_shared: 0,
    level_change_request_created: 0,
    level_change_request_decided: 0,
  };
}

function toActionCount(rows: Array<{ action: string; _count: { _all: number } }>) {
  const next = emptyActionCount();
  for (const row of rows) {
    if (row.action in next) {
      next[row.action as keyof ActionCount] = row._count._all;
    }
  }
  return next;
}

function computeRate(purchases: number, checkouts: number) {
  if (checkouts <= 0) return 0;
  return Number(((purchases / checkouts) * 100).toFixed(1));
}

export async function getAdminSoTDashboardSnapshot(): Promise<AdminSoTDashboardSnapshot> {
  const since7d = subDays(new Date(), 7);
  const since30d = subDays(new Date(), 30);

  const [auditRows7d, auditRows30d, latestAudit, ga4] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ["action"],
      where: {
        createdAt: { gte: since7d },
        action: { in: [...TRACKED_AUDIT_ACTIONS] },
      },
      _count: { _all: true },
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      where: {
        createdAt: { gte: since30d },
        action: { in: [...TRACKED_AUDIT_ACTIONS] },
      },
      _count: { _all: true },
    }),
    prisma.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    getAdminGa4Snapshot(),
  ]);

  const counts7d = toActionCount(auditRows7d);
  const counts30d = toActionCount(auditRows30d);

  return {
    window: "7d",
    sqlAudit: {
      counts7d,
      counts30d,
      checkoutToPurchaseRate7d: computeRate(
        counts7d.course_purchase_succeeded,
        counts7d.course_checkout_started,
      ),
      latestAuditAt: latestAudit?.createdAt.toISOString() ?? null,
    },
    ga4,
  };
}
