import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const courses = await prisma.course.findMany({ orderBy: { createdAt: "desc" } });
    return ok({ courses });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const body = (await request.json()) as {
      slug?: string;
      title?: string;
      description?: string;
      priceVnd?: number;
      durationDays?: number;
      coverImageUrl?: string;
    };

    const course = await prisma.course.create({
      data: {
        slug: body.slug ?? "",
        title: body.title ?? "",
        description: body.description ?? "",
        priceVnd: body.priceVnd ?? 0,
        durationDays: body.durationDays ?? 30,
        coverImageUrl: body.coverImageUrl,
      },
    });

    return ok({ course });
  } catch (error) {
    return handleRouteError(error);
  }
}
