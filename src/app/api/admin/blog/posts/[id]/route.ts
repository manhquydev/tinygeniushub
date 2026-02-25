import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { blogService } from "@/modules/blog/blog-service";

const updateSchema = z.object({
  slug: z.string().trim().min(2).max(160).optional(),
  type: z.enum(["ARTICLE", "TIP", "NEWS", "GUIDE", "RESEARCH", "STORY"]).optional(),
  titleVi: z.string().trim().min(2).max(250).optional(),
  titleEn: z.string().trim().min(2).max(250).optional(),
  excerptVi: z.string().trim().min(10).max(1000).optional(),
  contentMarkdown: z.string().trim().min(10).optional(),
  categoryId: z.string().min(1).optional(),
  authorId: z.string().min(1).optional(),
  ageGroup: z.enum(["UNDER_3", "AGE_3_5", "AGE_6_8", "AGE_9_12", "ALL_AGES"]).optional(),
  tagIds: z.array(z.string().min(1)).optional(),
  coverImageUrl: z.string().url().optional(),
  metaTitleVi: z.string().trim().min(2).max(250).optional(),
  metaDescVi: z.string().trim().min(2).max(500).optional(),
  scheduledAt: z.coerce.date().optional(),
  status: z.enum(["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const payload = updateSchema.parse(await request.json());
    const { id } = await context.params;

    const post = await blogService.updatePost({
      id,
      ...payload,
    });

    return NextResponse.json({ post });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.posts.update",
    });
  }
}

