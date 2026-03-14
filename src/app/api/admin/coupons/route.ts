import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createAdminActionLog, createCoupon, listCoupons } from "@/modules/admin/service";
import { z } from "zod";

const createCouponSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/i),
  discountPercent: z.number().min(0).max(100),
  maxUses: z.number().int().min(1).nullish(),
  expiresAt: z.string().datetime().nullish(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const coupons = await listCoupons();
    return ok({ coupons });
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
    const body = createCouponSchema.parse(await request.json());

    const coupon = await createCoupon(
      {
        code: body.code,
        discountPercent: body.discountPercent,
        maxUses: body.maxUses ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
      admin.email,
    );
    await createAdminActionLog({
      adminEmail: admin.email,
      action: "CREATE_COUPON",
      target: coupon.code,
      detail: {
        discountPercent: coupon.discountPercent,
        maxUses: coupon.maxUses,
      },
    });

    return ok({ coupon });
  } catch (error) {
    return handleRouteError(error);
  }
}


