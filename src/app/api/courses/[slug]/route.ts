import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { getCourse, getEnrollment } from "@/modules/courses/course-service";
import { getCourseBundleByCourseSlug } from "@/modules/courses/course-bundles";
import { getBundleStorefrontContent } from "@/modules/courses/course-storefront-content";
import {
  buildStorefrontCourseContract,
  STOREFRONT_COURSE_CONTRACT_VERSION,
} from "@/modules/courses/storefront-course-contract";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const course = await getCourse(slug);
    if (!course || !course.isPublished) {
      return fail("Course not found", 404);
    }

    const parent = await getParentFromRequest(request);
    let enrolled = false;
    if (parent) {
      const enrollment = await getEnrollment(course.id, parent.id);
      enrolled = Boolean(enrollment);
    }

    const bundle = getCourseBundleByCourseSlug(course.slug);
    const trackLabel = bundle ? getBundleStorefrontContent(bundle.slug).shortLabel : null;
    const videoCount = course.lessons.reduce((count, item) => {
      const lesson = item.lesson;
      const hasVideo = Boolean(lesson.videoSource || lesson.bunnyVideoId || lesson.videoStatus !== "none");
      return hasVideo ? count + 1 : count;
    }, 0);
    const storefrontContract = buildStorefrontCourseContract({
      trackLabel,
      lessonCount: course.lessons.length,
      durationDays: course.durationDays,
      videoCount,
    });

    return ok({
      contractVersion: STOREFRONT_COURSE_CONTRACT_VERSION,
      course,
      enrolled,
      storefrontContract,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
