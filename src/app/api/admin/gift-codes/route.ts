import { z } from "zod";
import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { generateGiftCodes } from "@/modules/courses/gift-code-service";
import { payablePlanCodeSchema } from "@/modules/billing/plan-config";
import { createAdminActionLog } from "@/modules/admin/service";

const createGiftCodesSchema = z.object({
  count: z.number().int().min(1).max(100).optional().default(1),
  planCode: payablePlanCodeSchema.optional().default("YEARLY_STANDARD"),
  durationDays: z.number().int().min(1).max(3650).optional().default(365),
  expiresAt: z.string().trim().min(1).optional(),
});

function parseGiftCodeExpiryDate(rawValue?: string): Date {
  if (!rawValue) {
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  const trimmed = rawValue.trim();
  const normalizedInput =
    /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? `${trimmed}T23:59:59.999`
      : trimmed;

  const parsed = new Date(normalizedInput);
  if (Number.isNaN(parsed.getTime())) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: "Invalid expiresAt value",
      },
    ]);
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const giftCodes = await prisma.giftCode.findMany({ orderBy: { createdAt: "desc" } });
    return ok({ giftCodes });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);

    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireAdminFromRequest(request);
    const body = createGiftCodesSchema.parse(await request.json());
    const expiresAt = parseGiftCodeExpiryDate(body.expiresAt);

    const codes = await generateGiftCodes({
      count: body.count,
      planCode: body.planCode,
      durationDays: body.durationDays,
      expiresAt,
      createdBy: admin.email,
    });
    const createdGiftCodes = await prisma.giftCode.findMany({
      where: { code: { in: codes } },
      orderBy: { createdAt: "desc" },
    });

    await createAdminActionLog({
      adminEmail: admin.email,
      action: "CREATE_GIFT_CODES",
      target: `gift_codes:${codes.length}`,
      detail: {
        count: body.count,
        planCode: body.planCode,
        durationDays: body.durationDays,
      },
    });

    return ok({ codes: createdGiftCodes });
  } catch (error) {
    return handleRouteError(error);
  }
}


