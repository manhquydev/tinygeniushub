import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { courseCatalogKey } from "@/modules/entitlement/catalog-key";
import { grantCourseOfferingInTx, grantPlanOfferingInTx } from "@/modules/entitlement/grant-from-billing";
import { LIVE_ENTITLEMENT_STATUSES } from "@/modules/entitlement/offering-types";
import { DomainError } from "@/modules/platform/errors";

const BACKFILL_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE_STANDARD,
  SubscriptionStatus.ACTIVE_FAMILYPLUS,
];

export async function backfillEntitlementGrants() {
  const [enrollments, subscriptions] = await Promise.all([
    prisma.courseEnrollment.findMany({
      select: { id: true, parentId: true, courseId: true, paymentId: true },
    }),
    prisma.subscription.findMany({
      where: { status: { in: BACKFILL_SUBSCRIPTION_STATUSES } },
      select: {
        parentId: true,
        planCode: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
      },
    }),
  ]);

  let courseTickets = 0;
  for (const row of enrollments) {
    await prisma.$transaction(async (tx) => {
      await grantCourseOfferingInTx(tx, {
        parentId: row.parentId,
        courseId: row.courseId,
        sourcePaymentId: row.paymentId,
      });
    });
    courseTickets += 1;
  }

  let planTickets = 0;
  for (const row of subscriptions) {
    const granted = await prisma.$transaction(async (tx) => {
      return grantPlanOfferingInTx(tx, {
        parentId: row.parentId,
        planCode: row.planCode,
        validFrom: row.currentPeriodStart,
        validUntil: row.currentPeriodEnd,
      });
    });
    if (granted) {
      planTickets += 1;
    }
  }

  const unmatched = await listEnrollmentsMissingLiveTickets(enrollments);
  if (unmatched.length > 0) {
    throw new DomainError(
      `Cutover blocked: ${unmatched.length} CourseEnrollment row(s) lack a live ticket: ${unmatched.map((row) => row.id).join(",")}`,
      409,
      "CUTOVER_ENROLLMENTS_UNMATCHED",
    );
  }

  return {
    enrollmentCount: enrollments.length,
    subscriptionCount: subscriptions.length,
    courseTickets,
    planTickets,
  };
}

async function listEnrollmentsMissingLiveTickets(
  enrollments: Array<{ id: string; parentId: string; courseId: string }>,
) {
  if (enrollments.length === 0) {
    return [];
  }

  const parentIds = [...new Set(enrollments.map((row) => row.parentId))];
  const tickets = await prisma.entitlement.findMany({
    where: {
      parentId: { in: parentIds },
      status: { in: [...LIVE_ENTITLEMENT_STATUSES] },
      offering: { catalogKey: { startsWith: "course:" } },
    },
    select: {
      parentId: true,
      offering: { select: { catalogKey: true } },
    },
  });
  const covered = new Set(tickets.map((row) => `${row.parentId}::${row.offering.catalogKey}`));
  return enrollments.filter((row) => !covered.has(`${row.parentId}::${courseCatalogKey(row.courseId)}`));
}
