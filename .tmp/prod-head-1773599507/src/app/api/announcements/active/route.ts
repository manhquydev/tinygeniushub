import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getActiveAnnouncement } from "@/modules/admin/service";

export async function GET() {
  try {
    const announcement = await getActiveAnnouncement();
    if (!announcement) {
      return ok(null);
    }

    return ok({
      id: announcement.id,
      message: announcement.message,
      type: announcement.type,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
