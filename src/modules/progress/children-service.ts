import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";

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
const MAX_CHILD_PROFILES_PER_PARENT = 1;

function isTransactionSerializationFailure(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export async function createChildProfile(parentId: string, input: z.infer<typeof childProfileInputSchema>) {
  const parsed = childProfileInputSchema.parse(input);

  for (let attempt = 0; attempt < MAX_CHILD_PROFILE_CREATE_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const profileCount = await tx.childProfile.count({ where: { parentId } });

          if (isProfileLimitReached(profileCount, MAX_CHILD_PROFILES_PER_PARENT)) {
            throw new DomainError(
              `Child profile limit reached (${MAX_CHILD_PROFILES_PER_PARENT}). Only one profile is allowed per parent account.`,
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
