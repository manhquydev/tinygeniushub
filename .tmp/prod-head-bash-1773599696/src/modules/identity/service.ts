import { addDays } from "date-fns";
import { Prisma, PlanCode, SubscriptionStatus } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
  displayName: z.string().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new DomainError("Email already exists", 409, "EMAIL_EXISTS");
  }

  throw error;
}

export async function registerParent(input: z.infer<typeof signupSchema>) {
  const parsed = signupSchema.parse(input);
  const normalizedEmail = parsed.email.toLowerCase();
  const userName = parsed.displayName ?? normalizedEmail;
  const passwordHash = await hashPassword(parsed.password);

  try {
    return await prisma.$transaction(async (tx) => {
      const parent = await tx.parentAccount.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          displayName: parsed.displayName,
        },
      });

      await tx.parentPreferences.create({
        data: {
          parentId: parent.id,
          weeklyReportChannel: "IN_APP_AND_EMAIL",
          weeklyReportEmailEnabled: true,
          timezone: "Asia/Bangkok",
        },
      });

      await tx.subscription.create({
        data: {
          parentId: parent.id,
          planCode: PlanCode.TRIAL,
          status: SubscriptionStatus.TRIALING,
          childProfileLimit: 3,
          caregiverLimit: 2,
          portfolioRetentionMaxDays: 90,
          currentPeriodStart: new Date(),
          currentPeriodEnd: addDays(new Date(), 7),
          autoRenew: true,
        },
      });

      await tx.user.upsert({
        where: { id: parent.id },
        create: {
          id: parent.id,
          email: normalizedEmail,
          name: userName,
          parentId: parent.id,
          emailVerified: false,
        },
        update: {
          email: normalizedEmail,
          name: userName,
          parentId: parent.id,
        },
      });

      await tx.account.upsert({
        where: {
          providerId_accountId: {
            providerId: "credential",
            accountId: parent.id,
          },
        },
        create: {
          id: `credential-${parent.id}`,
          accountId: parent.id,
          providerId: "credential",
          userId: parent.id,
          password: passwordHash,
        },
        update: {
          userId: parent.id,
          password: passwordHash,
        },
      });

      return parent;
    });
  } catch (error) {
    return mapPrismaError(error);
  }
}

export async function authenticateParent(input: z.infer<typeof loginSchema>) {
  const parsed = loginSchema.parse(input);
  const parent = await prisma.parentAccount.findUnique({
    where: { email: parsed.email.toLowerCase() },
    include: {
      subscription: true,
      preferences: true,
    },
  });

  if (!parent) {
    throw new DomainError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const matched = await verifyPassword(parsed.password, parent.passwordHash);
  if (!matched) {
    throw new DomainError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  await prisma.parentAccount.update({
    where: { id: parent.id },
    data: { lastActiveAt: new Date() },
  });

  return parent;
}
