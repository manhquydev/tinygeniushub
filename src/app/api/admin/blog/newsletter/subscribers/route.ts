import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/route-error";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const subscribers = await prisma.blogNewsletterSubscriber.findMany({
      where: {
        verified: true,
      },
      orderBy: {
        subscribedAt: "desc",
      },
      select: {
        id: true,
        email: true,
        nameVi: true,
        subscribedAt: true,
      },
    });

    return NextResponse.json({ subscribers });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.newsletter.subscribers",
    });
  }
}
