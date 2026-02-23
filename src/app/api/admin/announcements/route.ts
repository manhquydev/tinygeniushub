import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { createAnnouncement, listSystemAnnouncements } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const announcements = await listSystemAnnouncements(5);
    return ok({ announcements });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);
    const body = (await request.json()) as {
      message?: string;
      type?: "INFO" | "WARNING" | "SUCCESS";
      scheduledAt?: string | null;
      endsAt?: string | null;
    };

    const announcement = await createAnnouncement({
      message: body.message ?? "",
      type: body.type,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      adminEmail: admin.email,
    });

    return ok({ announcement });
  } catch (error) {
    return handleRouteError(error);
  }
}
