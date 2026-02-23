import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { handleRouteError } from "@/lib/route-error";
import { commentService } from "@/modules/blog/comment-service";

const moderationSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "SPAM", "DELETED"]),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const comments = await commentService.getPendingComments();
    return NextResponse.json({ comments });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.comments.list",
    });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const payload = moderationSchema.parse(await request.json());
    await commentService.moderateComment(payload.id, payload.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.comments.moderate",
    });
  }
}
