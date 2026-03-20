import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getCourses } from "@/modules/courses/course-service";

export async function GET() {
  try {
    const courses = await getCourses();
    return ok({ courses });
  } catch (error) {
    return handleRouteError(error);
  }
}
