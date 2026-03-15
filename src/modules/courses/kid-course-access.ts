import { prisma } from "@/lib/db";
import {
  getBundleCourseSlugFilters,
  getCourseBundleByRootSlug,
  type CourseBundleDefinition,
} from "@/modules/courses/course-bundles";

type CourseRef = {
  id: string;
  slug: string;
};

export type KidCourseAccessResolution = {
  requestedSlug: string;
  resolvedSlug: string;
  course: CourseRef | null;
  bundle: CourseBundleDefinition | null;
  hasAccess: boolean;
};

function resolveCourseSlugFromRequestedSlug(
  requestedSlug: string,
  bundle: CourseBundleDefinition | null,
) {
  // Bundle page slugs (e.g. little-fox-en) map to an entry course slug (e.g. littlefox).
  if (bundle && requestedSlug === bundle.slug) {
    return bundle.entryCourseSlug;
  }
  return requestedSlug;
}

export async function resolveKidCourseAccess(params: {
  parentId: string;
  requestedSlug: string;
}): Promise<KidCourseAccessResolution> {
  const bundle = getCourseBundleByRootSlug(params.requestedSlug);
  const resolvedSlug = resolveCourseSlugFromRequestedSlug(params.requestedSlug, bundle);

  const course = await prisma.course.findUnique({
    where: { slug: resolvedSlug },
    select: { id: true, slug: true },
  });

  if (!course) {
    return {
      requestedSlug: params.requestedSlug,
      resolvedSlug,
      course: null,
      bundle,
      hasAccess: false,
    };
  }

  const directEnrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_parentId: {
        courseId: course.id,
        parentId: params.parentId,
      },
    },
    select: { id: true },
  });

  if (directEnrollment) {
    return {
      requestedSlug: params.requestedSlug,
      resolvedSlug,
      course,
      bundle,
      hasAccess: true,
    };
  }

  if (!bundle) {
    return {
      requestedSlug: params.requestedSlug,
      resolvedSlug,
      course,
      bundle: null,
      hasAccess: false,
    };
  }

  const bundleEnrollment = await prisma.courseEnrollment.findFirst({
    where: {
      parentId: params.parentId,
      course: {
        OR: getBundleCourseSlugFilters(bundle),
      },
    },
    select: { id: true },
  });

  return {
    requestedSlug: params.requestedSlug,
    resolvedSlug,
    course,
    bundle,
    hasAccess: Boolean(bundleEnrollment),
  };
}
