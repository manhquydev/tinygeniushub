import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { blogService } from "@/modules/blog/blog-service";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireAdminFromRequest(request);
    const { id } = await context.params;

    await blogService.publishPost(id, admin.email);
    return NextResponse.json({ success: true, publishedAt: new Date() });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.posts.publish",
    });
  }
}




