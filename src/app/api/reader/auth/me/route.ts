import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { getReaderFromRequest } from "@/lib/auth/reader";
import { handleRouteError } from "@/lib/route-error";

export async function GET(request: NextRequest) {
  try {
    const reader = await getReaderFromRequest(request);
    return ok({ reader });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "reader.auth.me",
    });
  }
}
