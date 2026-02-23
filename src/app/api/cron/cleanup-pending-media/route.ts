import type { NextRequest } from "next/server";
import { isCronRequestAuthorized } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";

export async function GET(request: NextRequest) {
  try {
    if (!isCronRequestAuthorized(request)) {
      return fail("Unauthorized", 401);
    }

    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const deleted = await prisma.evidenceMedia.deleteMany({
      where: {
        uploadStatus: "PENDING",
        createdAt: {
          lt: cutoff,
        },
      },
    });

    return ok({
      deleted: deleted.count,
      cutoffIso: cutoff.toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
