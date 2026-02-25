import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getCourses } from "@/modules/courses/course-service";

export async function GET(_request: NextRequest) {
  try {
    const courses = await getCourses();
    return ok({ courses });
  } catch (error) {
    return handleRouteError(error);
  }
}
