import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { z } from "zod";

const courseCoverImageSchema = z.union([
  z.string().url(),
  z.string().regex(/^\/[^\s]*$/),
]);

const createCourseSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  priceVnd: z.number().int().min(0).default(0),
  listPriceVnd: z.number().int().min(0).optional(),
  salePriceVnd: z.number().int().min(0).optional(),
  durationDays: z.number().int().min(1).default(30),
  coverImageUrl: courseCoverImageSchema.nullish(),
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
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const body = createCourseSchema.parse(await request.json());

    const course = await prisma.course.create({
      data: {
        slug: body.slug,
        title: body.title,
        description: body.description,
        priceVnd: body.priceVnd,
        listPriceVnd: body.listPriceVnd ?? body.priceVnd,
        salePriceVnd: body.salePriceVnd ?? body.priceVnd,
        durationDays: body.durationDays,
        coverImageUrl: body.coverImageUrl,
      },
    });

    return ok({ course });
  } catch (error) {
    return handleRouteError(error);
  }
}


