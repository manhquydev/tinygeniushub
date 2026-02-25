import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { generateGiftCodes } from "@/modules/courses/gift-code-service";

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
    const body = (await request.json()) as {
      count?: number;
      planCode?: string;
      durationDays?: number;
      expiresAt?: string;
    };

    const codes = await generateGiftCodes({
      count: body.count ?? 1,
      planCode: body.planCode ?? "YEARLY_STANDARD",
      durationDays: body.durationDays ?? 365,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdBy: admin.email,
    });

    return ok({ codes });
  } catch (error) {
    return handleRouteError(error);
  }
}
