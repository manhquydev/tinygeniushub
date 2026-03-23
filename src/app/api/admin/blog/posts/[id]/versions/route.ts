import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { blogService } from "@/modules/blog/blog-service";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    await requireAdminFromRequest(request);
    const rawSearchParams = new URL(request.url).searchParams;
    const query = querySchema.parse(Object.fromEntries(rawSearchParams.entries()));
    const { id } = await context.params;

    const versions = await blogService.listPostVersions(id, query.limit);
    return NextResponse.json({ versions });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.posts.versions.list",
    });
  }
}

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

    const version = await blogService.saveCurrentPostVersion(id, admin.email);
    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.posts.versions.create",
    });
  }
}
