import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseActivitySpec, parseActivityType } from "@/modules/content/activity-types";
import {
  listEntitledCourseMissions,
  listEntitledTrackMissions,
  unionMissions,
} from "@/modules/content/mission-query";
import { loadHouseholdLearnAccess } from "@/modules/entitlement/assert-can-learn";
import { DomainError } from "@/modules/platform/errors";

async function assertOwnedChild(parentId: string, childId: string) {
  const child = await prisma.childProfile.findFirst({
    where: { id: childId, parentId },
    select: { id: true },
  });
  if (!child) {
    throw new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND");
  }
}

async function listGatedTodayMissions(parentId: string, childId: string) {
  await assertOwnedChild(parentId, childId);
  const access = await loadHouseholdLearnAccess(parentId);
  const trialOnly = access.isTrialHousehold && !access.hasPaidPlatformPass;
  const [trackMissions, courseMissions] = await Promise.all([
    listEntitledTrackMissions({
      childId,
      trackCodes: access.trackCodes,
      trialOnly,
    }),
    listEntitledCourseMissions({
      childId,
      courseIds: access.courseIds,
    }),
  ]);
  return unionMissions(courseMissions, trackMissions);
}

export async function getTodayMission(input: {
  parentId: string;
  childId: string;
  subscriptionStatus?: SubscriptionStatus | null;
}) {
  void input.subscriptionStatus;
  return listGatedTodayMissions(input.parentId, input.childId);
}

export async function listLessonActivitiesForPlayer(lessonId: string) {
  const activities = await prisma.activity.findMany({
    where: { lessonId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      type: true,
      prompt: true,
      spec: true,
      passCriteria: true,
    },
  });

  return activities.map((activity) => {
    const type = parseActivityType(activity.type);
    return {
      ...activity,
      type,
      spec: parseActivitySpec(activity.spec, type),
    };
  });
}

export async function getRealKidGardenMission(input: {
  parentId: string;
  childId: string;
}) {
  return listGatedTodayMissions(input.parentId, input.childId);
}
