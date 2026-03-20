import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { acceptCaregiverInviteByToken } from "@/modules/caregivers/service";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return fail("Token is required", 400);
    }

    const result = await acceptCaregiverInviteByToken(token);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
