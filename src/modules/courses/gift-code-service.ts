import { randomBytes } from "node:crypto";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { translateError } from "@/lib/route-error";
import {
  getPayablePlanConfig,
  payablePlanCodeSchema,
  toPrismaPlanCode,
} from "@/modules/billing/plan-config";
import { DomainError } from "@/modules/platform/errors";
import { grantPlanOfferingInTx, offeringCodeForPlan } from "@/modules/entitlement/grant-from-billing";

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
  const planCode = payablePlanCodeSchema.parse(options.planCode);
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
      planCode,
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
    throw new DomainError(await translateError("errors.giftCodeNotFound"), 404, "GIFT_CODE_NOT_FOUND");
  }
  if (giftCode.usedAt) {
    throw new DomainError(await translateError("errors.giftCodeUsed"), 409, "GIFT_CODE_USED");
  }
  if (giftCode.expiresAt < new Date()) {
    throw new DomainError(await translateError("errors.giftCodeExpired"), 410, "GIFT_CODE_EXPIRED");
  }

  const parsedPlan = payablePlanCodeSchema.safeParse(giftCode.planCode);
  if (!parsedPlan.success || !offeringCodeForPlan(parsedPlan.data)) {
    throw new DomainError(await translateError("errors.giftCodePlanInvalid"), 422, "GIFT_CODE_PLAN_INVALID");
  }

  const resolvedPlanCode = parsedPlan.data;
  const resolvedPlanConfig = getPayablePlanConfig(resolvedPlanCode);
  const prismaPlanCode = toPrismaPlanCode(resolvedPlanCode);

  await prisma.$transaction(async (tx) => {
    const existingSub = await tx.subscription.findUnique({ where: { parentId } });
    const now = new Date();
    const periodStart = now;
    const periodEnd = addDays(
      existingSub?.currentPeriodEnd && existingSub.currentPeriodEnd > now
        ? existingSub.currentPeriodEnd
        : now,
      giftCode.durationDays,
    );

    const claimed = await tx.giftCode.updateMany({
      where: { id: giftCode.id, usedAt: null },
      data: { usedByParentId: parentId, usedAt: now },
    });
    if (claimed.count !== 1) {
      throw new DomainError(await translateError("errors.giftCodeUsed"), 409, "GIFT_CODE_USED");
    }

    await tx.subscription.upsert({
      where: { parentId },
      create: {
        parentId,
        planCode: prismaPlanCode,
        status: resolvedPlanConfig.status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        childProfileLimit: resolvedPlanConfig.childProfileLimit,
        caregiverLimit: resolvedPlanConfig.caregiverLimit,
        portfolioRetentionMaxDays: resolvedPlanConfig.portfolioRetentionMaxDays,
      },
      update: {
        planCode: prismaPlanCode,
        status: resolvedPlanConfig.status,
        childProfileLimit: resolvedPlanConfig.childProfileLimit,
        caregiverLimit: resolvedPlanConfig.caregiverLimit,
        portfolioRetentionMaxDays: resolvedPlanConfig.portfolioRetentionMaxDays,
        currentPeriodEnd: periodEnd,
      },
    });

    await grantPlanOfferingInTx(tx, {
      parentId,
      planCode: resolvedPlanCode,
      validFrom: periodStart,
      validUntil: periodEnd,
    });
  });
}
