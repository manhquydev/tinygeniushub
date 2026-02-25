import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createCourseSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  priceVnd: z.number().int().min(0).default(0),
  durationDays: z.number().int().min(1).default(30),
  coverImageUrl: z.string().url().nullish(),
});

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
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const body = createCourseSchema.parse(await request.json());

    const course = await prisma.course.create({
      data: {
        slug: body.slug,
        title: body.title,
        description: body.description,
        priceVnd: body.priceVnd,
        durationDays: body.durationDays,
        coverImageUrl: body.coverImageUrl,
      },
    });

    return ok({ course });
  } catch (error) {
    return handleRouteError(error);
  }
}
