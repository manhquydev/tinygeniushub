/**
 * GET /api/abeka/packages
 * List all available curriculum packages
 */

import { NextRequest } from "next/server";
import { listPackages } from "@/modules/billing/package-service";
import { handleRouteError } from "@/lib/route-error";
import { ok } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const packages = await listPackages();
    return ok({ packages });
  } catch (error) {
    return handleRouteError(error);
  }
}
