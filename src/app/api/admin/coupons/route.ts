import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { createCoupon, listCoupons } from "@/modules/admin/service";

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
    const admin = await requireAdminFromRequest(request);
    const body = (await request.json()) as {
      code?: string;
      discountPercent?: number;
      maxUses?: number | null;
      expiresAt?: string | null;
    };

    const coupon = await createCoupon(
      {
        code: body.code ?? "",
        discountPercent: body.discountPercent ?? 0,
        maxUses: body.maxUses ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
      admin.email,
    );

    return ok({ coupon });
  } catch (error) {
    return handleRouteError(error);
  }
}
