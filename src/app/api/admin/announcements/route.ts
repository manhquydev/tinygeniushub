import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createAnnouncement, listSystemAnnouncements } from "@/modules/admin/service";
import { z } from "zod";

const createAnnouncementSchema = z.object({
  message: z.string().min(1).max(1000),
  type: z.enum(["INFO", "WARNING", "SUCCESS"]).default("INFO"),
  scheduledAt: z.string().datetime().nullish(),
  endsAt: z.string().datetime().nullish(),
});

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
    assertTrustedOrigin(request);
    const admin = await requireAdminFromRequest(request);
    const body = createAnnouncementSchema.parse(await request.json());

    const announcement = await createAnnouncement({
      message: body.message,
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
