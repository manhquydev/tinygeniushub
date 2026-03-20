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

    const due = await prisma.blogPost.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (due.length === 0) {
      return ok({
        published: 0,
        slugs: [],
      });
    }

    await prisma.blogPost.updateMany({
      where: {
        id: {
          in: due.map((post) => post.id),
        },
      },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return ok({
      published: due.length,
      slugs: due.map((post) => post.slug),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
