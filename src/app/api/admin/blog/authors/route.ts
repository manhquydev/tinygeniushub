import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/route-error";
import * as blogRepository from "@/modules/blog/blog-repository";

const createSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  displayName: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(2).max(1000).optional(),
  avatarUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  email: z.string().email().optional(),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const authors = await blogRepository.findAuthors();
    return NextResponse.json({ authors });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.authors.list",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const payload = createSchema.parse(await request.json());

    const author = await prisma.blogAuthor.create({
      data: payload,
      select: {
        id: true,
        slug: true,
        displayName: true,
        role: true,
        bio: true,
        avatarUrl: true,
        linkedinUrl: true,
        email: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ author }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.authors.create",
    });
  }
}

