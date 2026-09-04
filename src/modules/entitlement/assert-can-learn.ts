import { PlanCode, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canAccess } from "@/modules/entitlement/entitlement-service";
import { LIVE_ENTITLEMENT_STATUSES, PLATFORM_PASS_KEY } from "@/modules/entitlement/offering-types";
import { DomainError } from "@/modules/platform/errors";

const LIVE_STATUSES = [...LIVE_ENTITLEMENT_STATUSES];
const PAID_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE_STANDARD,
  SubscriptionStatus.ACTIVE_FAMILYPLUS,
  SubscriptionStatus.GRACE,
  SubscriptionStatus.CANCELED_AT_PERIOD_END,
];

export type HouseholdLearnAccess = {
  catalogKeys: string[];
  courseIds: string[];
  trackCodes: Array<"ENGLISH" | "MATH">;
  isTrialHousehold: boolean;
  hasPlatformPass: boolean;
  hasPaidPlatformPass: boolean;
};

function isCurrentlyValid(ticket: { validFrom: Date; validUntil: Date | null }, now: Date) {
  if (ticket.validFrom > now) {
    return false;
  }
  return ticket.validUntil == null || ticket.validUntil > now;
}

export async function loadHouseholdLearnAccess(parentId: string): Promise<HouseholdLearnAccess> {
  const now = new Date();
  const [tickets, subscription] = await Promise.all([
    prisma.entitlement.findMany({
      where: { parentId, status: { in: LIVE_STATUSES } },
      select: { validFrom: true, validUntil: true, offering: { select: { catalogKey: true } } },
    }),
    prisma.subscription.findUnique({
      where: { parentId },
      select: { status: true, planCode: true },
    }),
  ]);

  const catalogKeys = tickets
    .filter((ticket) => isCurrentlyValid(ticket, now))
    .map((ticket) => ticket.offering.catalogKey);
  const trial = Boolean(
    subscription &&
      (subscription.status === SubscriptionStatus.TRIALING || subscription.planCode === PlanCode.TRIAL),
  );
  const hasPlatformPass = catalogKeys.includes(PLATFORM_PASS_KEY);
  const hasPaidPlatformPass =
    hasPlatformPass && Boolean(subscription && PAID_SUBSCRIPTION_STATUSES.includes(subscription.status));

  const trackCodes = new Set<"ENGLISH" | "MATH">();
  if (hasPlatformPass) {
    trackCodes.add("ENGLISH");
    trackCodes.add("MATH");
  }
  if (catalogKeys.includes("track:ENGLISH")) {
    trackCodes.add("ENGLISH");
  }
  if (catalogKeys.includes("track:MATH")) {
    trackCodes.add("MATH");
  }

  const courseIds = catalogKeys
    .filter((key) => key.startsWith("course:") && !key.includes(":level:"))
    .map((key) => key.slice("course:".length));

  return {
    catalogKeys,
    courseIds,
    trackCodes: [...trackCodes],
    isTrialHousehold: trial,
    hasPlatformPass,
    hasPaidPlatformPass,
  };
}

export async function assertCanLearn(input: { parentId: string; childId: string; lessonId: string }) {
  const child = await prisma.childProfile.findFirst({
    where: { id: input.childId, parentId: input.parentId },
    select: { id: true, parentId: true, adaptiveEnabled: true },
  });
  if (!child) {
    throw new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND");
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: input.lessonId },
    select: {
      id: true,
      trialEnabled: true,
      estimatedMinutes: true,
      videoSource: true,
    },
  });
  if (!lesson) {
    throw new DomainError("Lesson not found", 404, "LESSON_NOT_FOUND");
  }

  const [ticketOk, subscription] = await Promise.all([
    canAccess({ parentId: input.parentId, lessonId: input.lessonId }),
    prisma.subscription.findUnique({
      where: { parentId: input.parentId },
      select: { status: true, planCode: true },
    }),
  ]);

  const trialTicketActive = Boolean(
    ticketOk &&
      subscription &&
      (subscription.status === SubscriptionStatus.TRIALING || subscription.planCode === PlanCode.TRIAL),
  );
  if (trialTicketActive && !lesson.trialEnabled) {
    throw new DomainError("Trial account can only access trial-enabled lessons", 403, "TRIAL_LESSON_RESTRICTED");
  }
  if (ticketOk) {
    return { child, lesson };
  }

  throw new DomainError("Household ticket required to learn this lesson", 403, "LEARN_ACCESS_DENIED");
}
