import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { listCaregiverInvites } from "@/modules/caregivers/service";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const snapshot = await listCaregiverInvites(parent.id);
    return ok(snapshot);
  } catch (error) {
    return handleRouteError(error);
  }
}
