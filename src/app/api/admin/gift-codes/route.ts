import { z } from "zod";
import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { generateGiftCodes } from "@/modules/courses/gift-code-service";

const createGiftCodesSchema = z.object({
  count: z.number().int().min(1).max(100).optional().default(1),
  planCode: z.string().min(1).optional().default("YEARLY_STANDARD"),
  durationDays: z.number().int().min(1).max(3650).optional().default(365),
  expiresAt: z.string().datetime().optional(),
});

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
    const admin = await requireAdminFromRequest(request);
    const body = createGiftCodesSchema.parse(await request.json());

    const codes = await generateGiftCodes({
      count: body.count,
      planCode: body.planCode,
      durationDays: body.durationDays,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdBy: admin.email,
    });

    return ok({ codes });
  } catch (error) {
    return handleRouteError(error);
  }
}
