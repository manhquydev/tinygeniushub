import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import * as blogRepository from "@/modules/blog/blog-repository";

const createSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  nameVi: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(2).max(400).optional(),
  emoji: z.string().trim().min(1).max(8).optional(),
  color: z.string().trim().min(3).max(20).optional(),
  parentId: z.string().min(1).optional(),
  orderNo: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const categories = await blogRepository.findCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.categories.list",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const payload = createSchema.parse(await request.json());

    const category = await prisma.blogCategory.create({
      data: payload,
      select: {
        id: true,
        slug: true,
        nameVi: true,
        nameEn: true,
        description: true,
        emoji: true,
        color: true,
        parentId: true,
        orderNo: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.categories.create",
    });
  }
}

