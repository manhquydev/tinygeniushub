import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { createCourseCheckoutSession } from "@/modules/courses/course-checkout-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { slug } = await params;
    const body = (await request.json()) as {
      successPath?: string;
      cancelPath?: string;
    };

    const result = await createCourseCheckoutSession({
      parentId: parent.id,
      slug,
      successPath: body.successPath,
      cancelPath: body.cancelPath,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
