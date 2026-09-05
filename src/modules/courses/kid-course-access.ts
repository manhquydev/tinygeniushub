import { prisma } from "@/lib/db";
import { getCourseBundleByRootSlug, type CourseBundleDefinition } from "@/modules/courses/course-bundles";
import { listLiveCourseIds } from "@/modules/entitlement/course-tickets";

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

export async function resolveKidCourseAccess(params: {
  parentId: string;
  requestedSlug: string;
}): Promise<KidCourseAccessResolution> {
  const bundle = getCourseBundleByRootSlug(params.requestedSlug);
  const resolvedSlug = params.requestedSlug;

  const course = await prisma.course.findUnique({
    where: { slug: resolvedSlug },
    select: { id: true, slug: true, isPublished: true },
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

  const ticketedIds = await listLiveCourseIds(params.parentId);
  const hasAccess = course.isPublished && ticketedIds.includes(course.id);

  return {
    requestedSlug: params.requestedSlug,
    resolvedSlug,
    course: { id: course.id, slug: course.slug },
    bundle,
    hasAccess,
  };
}
