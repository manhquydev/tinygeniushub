import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getStorefrontCourses } from "@/modules/courses/course-service";
import { STOREFRONT_COURSE_CONTRACT_VERSION } from "@/modules/courses/storefront-course-contract";

export async function GET() {
  try {
    const courses = await getStorefrontCourses();
    return ok({
      contractVersion: STOREFRONT_COURSE_CONTRACT_VERSION,
      contract: {
        trackLabel: "string (fallback: 'Lộ trình học')",
        lessonCount: "number > 0 (fallback from videoCount)",
        durationDays: "number > 0 (fallback from lessonCount cadence)",
        videoCount: "number > 0 (actual allocated content, fallback from lessonCount)",
      },
      courses,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
