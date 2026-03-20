import { randomBytes } from "node:crypto";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";

/** Generate random 8-char uppercase alphanumeric code */
function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function generateGiftCodes(options: {
  count: number;
  planCode: string;
  durationDays: number;
  expiresAt: Date;
  createdBy: string;
}): Promise<string[]> {
  const codes: string[] = [];

  for (let i = 0; i < options.count; i++) {
    // Ensure uniqueness within generated batch
    let code: string;
    do {
      code = generateCode();
    } while (codes.includes(code));
    codes.push(code);
  }

  await prisma.giftCode.createMany({
    data: codes.map((code) => ({
      code,
      planCode: options.planCode,
      durationDays: options.durationDays,
      expiresAt: options.expiresAt,
      createdBy: options.createdBy,
    })),
    skipDuplicates: true,
  });

  return codes;
}

export async function redeemGiftCode(code: string, parentId: string): Promise<void> {
  const giftCode = await prisma.giftCode.findUnique({ where: { code } });

  if (!giftCode) {
    throw new DomainError("Invalid gift code", 404, "GIFT_CODE_NOT_FOUND");
  }
  if (giftCode.usedAt) {
    throw new DomainError("Gift code already used", 409, "GIFT_CODE_USED");
  }
  if (giftCode.expiresAt < new Date()) {
    throw new DomainError("Gift code has expired", 410, "GIFT_CODE_EXPIRED");
  }

  // Mark as used
  await prisma.giftCode.update({
    where: { id: giftCode.id },
    data: { usedByParentId: parentId, usedAt: new Date() },
  });

  // Activate or extend subscription
  const existingSub = await prisma.subscription.findUnique({ where: { parentId } });
  const now = new Date();
  const periodStart = now;
  const periodEnd = addDays(
    existingSub?.currentPeriodEnd && existingSub.currentPeriodEnd > now
      ? existingSub.currentPeriodEnd
      : now,
    giftCode.durationDays,
  );

  const planCode = giftCode.planCode === "YEARLY_FAMILY_PLUS" ? "YEARLY_FAMILY_PLUS" : "YEARLY_STANDARD";

  await prisma.subscription.upsert({
    where: { parentId },
    create: {
      parentId,
      planCode: planCode as "YEARLY_STANDARD" | "YEARLY_FAMILY_PLUS",
      status: "ACTIVE_STANDARD",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      childProfileLimit: 3,
      caregiverLimit: 2,
      portfolioRetentionMaxDays: 365,
    },
    update: {
      planCode: planCode as "YEARLY_STANDARD" | "YEARLY_FAMILY_PLUS",
      status: "ACTIVE_STANDARD",
      currentPeriodEnd: periodEnd,
    },
  });
}
