import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getParentFromRequest } from "@/lib/auth/session";
import { getApprovedReviews, createReview } from "@/modules/courses/course-review-service";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const result = await getApprovedReviews(course.id, page);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    assertTrustedOrigin(request);
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { rating, comment } = body as { rating: unknown; comment?: unknown };

    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
    }

    if (comment !== undefined && (typeof comment !== "string" || comment.length > 1000)) {
      return NextResponse.json({ error: "Comment must be a string of 1000 characters or fewer" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const review = await createReview(course.id, parent.id, {
      rating,
      comment: typeof comment === "string" ? comment : undefined,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Must be enrolled to review") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return handleRouteError(error);
  }
}
