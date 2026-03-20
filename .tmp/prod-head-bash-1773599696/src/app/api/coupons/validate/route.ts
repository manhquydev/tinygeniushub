import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { validateCoupon } from "@/modules/admin/service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      code?: string;
    };

    const result = await validateCoupon(body.code ?? "");
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
