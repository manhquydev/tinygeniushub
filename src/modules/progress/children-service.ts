import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";

const CHILD_PROFILE_LIMIT_FALLBACK = 1;
const CAREGIVER_LIMIT_FALLBACK = 2;

export async function getHouseholdSlotLimits(parentId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { parentId },
    select: { childProfileLimit: true, caregiverLimit: true },
  });
  return {
    childProfileLimit: subscription?.childProfileLimit ?? CHILD_PROFILE_LIMIT_FALLBACK,
    caregiverLimit: subscription?.caregiverLimit ?? CAREGIVER_LIMIT_FALLBACK,
  };
}

export const childProfileInputSchema = z.object({
  nickname: z.string().min(1).max(60),
  ageBand: z.enum(["2-3", "3-4", "4-5", "5-6"]),
  avatarId: z.string().max(120).optional(),
});

export async function listChildProfiles(parentId: string) {
  return prisma.childProfile.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
  });
}

export function isProfileLimitReached(profileCount: number, childProfileLimit: number) {
  return profileCount >= childProfileLimit;
}

const MAX_CHILD_PROFILE_CREATE_RETRIES = 3;

function isTransactionSerializationFailure(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export async function createChildProfile(parentId: string, input: z.infer<typeof childProfileInputSchema>) {
  const parsed = childProfileInputSchema.parse(input);

  for (let attempt = 0; attempt < MAX_CHILD_PROFILE_CREATE_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const [profileCount, subscription] = await Promise.all([
            tx.childProfile.count({ where: { parentId } }),
            tx.subscription.findUnique({
              where: { parentId },
              select: { childProfileLimit: true },
            }),
          ]);
          const limit = subscription?.childProfileLimit ?? CHILD_PROFILE_LIMIT_FALLBACK;
          if (isProfileLimitReached(profileCount, limit)) {
            throw new DomainError(
              "Child profile limit reached for this household.",
              409,
              "PROFILE_LIMIT_REACHED",
            );
          }

          return tx.childProfile.create({
            data: {
              parentId,
              nickname: parsed.nickname,
              ageBand: parsed.ageBand,
              avatarId: parsed.avatarId,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      const canRetry = attempt < MAX_CHILD_PROFILE_CREATE_RETRIES - 1;
      if (canRetry && isTransactionSerializationFailure(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new DomainError("Could not create child profile due to concurrent updates. Please retry.", 409, "PROFILE_LIMIT_RETRY_REQUIRED");
}

export const childProfileUpdateSchema = z.object({
  nickname: z.string().min(1).max(60).optional(),
  ageBand: z.enum(["2-3", "3-4", "4-5", "5-6"]).optional(),
  avatarId: z.string().max(120).optional(),
  adaptiveEnabled: z.boolean().optional(),
});

export const childDailyGoalUpdateSchema = z.object({
  dailyGoalMinutes: z
    .number()
    .int()
    .min(0)
    .max(120)
    .refine((value) => value % 5 === 0, "dailyGoalMinutes must be a multiple of 5"),
});

export async function updateChildProfile(
  parentId: string,
  childId: string,
  input: z.infer<typeof childProfileUpdateSchema>,
) {
  const parsed = childProfileUpdateSchema.parse(input);
  const child = await prisma.childProfile.findFirst({
    where: {
      id: childId,
      parentId,
    },
  });

  if (!child) {
    throw new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND");
  }

  return prisma.childProfile.update({
    where: { id: child.id },
    data: parsed,
  });
}

export async function deleteChildProfile(parentId: string, childId: string) {
  const child = await prisma.childProfile.findFirst({
    where: {
      id: childId,
      parentId,
    },
  });

  if (!child) {
    throw new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND");
  }

  await prisma.childProfile.delete({
    where: { id: child.id },
  });

  return { deleted: true };
}

export async function updateChildDailyGoal(
  parentId: string,
  childId: string,
  input: z.infer<typeof childDailyGoalUpdateSchema>,
) {
  const parsed = childDailyGoalUpdateSchema.parse(input);

  const child = await prisma.childProfile.findFirst({
    where: {
      id: childId,
      parentId,
    },
    select: {
      id: true,
    },
  });
  if (!child) {
    throw new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND");
  }

  return prisma.childProfile.update({
    where: {
      id: child.id,
    },
    data: {
      dailyGoalMinutes: parsed.dailyGoalMinutes,
    },
    select: {
      id: true,
      dailyGoalMinutes: true,
    },
  });
}
