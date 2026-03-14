import { prisma } from "@/lib/db";
import {
  getCourseBundleByCourseSlug,
  type CourseBundleDefinition,
} from "@/modules/courses/course-bundles";
import { resolveCourseCoverImage } from "@/modules/courses/course-media";
import { DomainError } from "@/modules/platform/errors";
import { enqueueCertificateGeneration } from "@/worker/queue";

/** Return all published courses */
export async function getCourses() {
  return prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Return a course with its ordered lessons */
export async function getCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      lessons: {
        orderBy: { orderNo: "asc" },
        include: { lesson: true },
      },
    },
  });
}

/** Return enrollment or null */
export async function getEnrollment(courseId: string, parentId: string) {
  return prisma.courseEnrollment.findUnique({
    where: { courseId_parentId: { courseId, parentId } },
  });
}

/** Create enrollment — throws if already enrolled */
export async function enrollParent(courseId: string, parentId: string, paymentId?: string) {
  const existing = await getEnrollment(courseId, parentId);
  if (existing) {
    throw new DomainError("Already enrolled in this course", 409, "ALREADY_ENROLLED");
  }

  return prisma.courseEnrollment.create({
    data: { courseId, parentId, paymentId },
  });
}

/** Mark enrollment as completed and queue certificate generation */
export async function completeCourse(enrollmentId: string) {
  const enrollment = await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: { completedAt: new Date() },
  });

  await enqueueCertificateGeneration(enrollmentId);

  return enrollment;
}

/** Return all enrollments for a parent ordered by most recent */
export async function getParentEnrollments(parentId: string) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { parentId },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          priceVnd: true,
          durationDays: true,
          coverImageUrl: true,
        },
      },
    },
  });

  return enrollments.map((enrollment) => ({
    ...enrollment,
    course: {
      ...enrollment.course,
      coverImageUrl: resolveCourseCoverImage(
        enrollment.course.slug,
        enrollment.course.coverImageUrl,
      ),
    },
  }));
}

/** Whether parent is enrolled in any course containing this lesson */
export async function canParentAccessCourseLesson(parentId: string, lessonId: string): Promise<boolean> {
  const courseLesson = await prisma.courseLesson.findFirst({
    where: {
      lessonId,
      course: {
        enrollments: {
          some: { parentId },
        },
      },
    },
  });

  return Boolean(courseLesson);
}

export type EnrolledCourseForKidDashboard = {
  enrollmentId: string;
  enrolledAt: Date;
  completedAt: Date | null;
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    coverImageUrl: string | null;
    durationDays: number;
    totalLessons: number;
    bundleSlug?: string;
    bundleCourseCount?: number;
  };
  journey: {
    id: string;
    status: string;
    seedName: string;
    currentTierNo: number;
    currentTierProgress: number;
    totalTiers: number;
    completedTiers: number;
    completedLessons: number;
  } | null;
};

type EnrollmentWithCourse = {
  id: string;
  courseId: string;
  enrolledAt: Date;
  completedAt: Date | null;
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    coverImageUrl: string | null;
    durationDays: number;
    _count: {
      lessons: number;
    };
  };
};

type JourneyWithTiers = {
  id: string;
  courseId: string;
  status: string;
  seedName: string;
  currentTierNo: number;
  currentTierProgress: number;
  tiers: Array<{
    tierNo: number;
    isCompleted: boolean;
    lessonCompleted: number;
  }>;
};

function buildBundleJourneySnapshot(params: {
  bundle: CourseBundleDefinition;
  childId: string;
  totalLessons: number;
  journeys: JourneyWithTiers[];
}) {
  const completedLessons = params.journeys.reduce(
    (sum, journey) =>
      sum + journey.tiers.reduce((tierSum, tier) => tierSum + tier.lessonCompleted, 0),
    0,
  );

  if (params.journeys.length === 0) {
    return null;
  }

  const totalTiers = params.journeys.reduce((sum, journey) => sum + journey.tiers.length, 0);
  const completedTiers = params.journeys.reduce(
    (sum, journey) => sum + journey.tiers.filter((tier) => tier.isCompleted).length,
    0,
  );

  let status = "SEEDED";
  if (params.totalLessons > 0 && completedLessons >= params.totalLessons) {
    status = "COMPLETED";
  } else if (completedLessons > 0) {
    status = "ACTIVE";
  } else if (params.journeys.some((journey) => journey.status === "PAUSED")) {
    status = "PAUSED";
  }

  const currentTierNo = params.journeys.reduce(
    (maxTierNo, journey) => Math.max(maxTierNo, journey.currentTierNo),
    1,
  );
  const currentTierProgress = Math.max(
    0,
    ...params.journeys.map((journey) => journey.currentTierProgress),
  );

  return {
    id: `bundle:${params.bundle.slug}:${params.childId}`,
    status,
    seedName: params.journeys[0]?.seedName ?? params.bundle.title,
    currentTierNo,
    currentTierProgress,
    totalTiers,
    completedTiers,
    completedLessons,
  };
}

/**
 * Returns enrolled courses for a parent with the child's journey progress.
 * Used by Kid Courses Dashboard (/kid/courses).
 */
export async function getEnrolledCoursesForKidDashboard(params: {
  parentId: string;
  childId: string;
}): Promise<EnrolledCourseForKidDashboard[]> {
  const enrollments: EnrollmentWithCourse[] = await prisma.courseEnrollment.findMany({
    where: {
      parentId: params.parentId,
      course: { isPublished: true },
    },
    orderBy: { enrolledAt: "asc" },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverImageUrl: true,
          durationDays: true,
          isPublished: true,
          _count: {
            select: { lessons: true },
          },
        },
      },
    },
  });

  const courseIds = enrollments.map((enrollment) => enrollment.courseId);
  const journeys: JourneyWithTiers[] =
    courseIds.length > 0
      ? await prisma.childCourseJourney.findMany({
          where: {
            childId: params.childId,
            courseId: { in: courseIds },
          },
          select: {
            id: true,
            courseId: true,
            status: true,
            seedName: true,
            currentTierNo: true,
            currentTierProgress: true,
            tiers: {
              select: {
                tierNo: true,
                isCompleted: true,
                lessonCompleted: true,
              },
            },
          },
        })
      : [];

  const journeyByCourseId = new Map(journeys.map((journey) => [journey.courseId, journey]));

  const grouped = new Map<
    string,
    {
      bundle: CourseBundleDefinition | null;
      enrollments: EnrollmentWithCourse[];
    }
  >();

  for (const enrollment of enrollments) {
    const bundle = getCourseBundleByCourseSlug(enrollment.course.slug);
    const groupKey = bundle ? `bundle:${bundle.slug}` : `course:${enrollment.course.id}`;
    const current = grouped.get(groupKey);

    if (!current) {
      grouped.set(groupKey, {
        bundle,
        enrollments: [enrollment],
      });
      continue;
    }

    current.enrollments.push(enrollment);
  }

  const rows: EnrolledCourseForKidDashboard[] = [];

  for (const group of grouped.values()) {
    const groupEnrollments = [...group.enrollments].sort(
      (a, b) => a.enrolledAt.getTime() - b.enrolledAt.getTime(),
    );

    if (group.bundle) {
      const representative =
        groupEnrollments.find(
          (enrollment) => enrollment.course.slug === group.bundle?.entryCourseSlug,
        ) ?? groupEnrollments[0];
      if (!representative) {
        continue;
      }

      const totalLessons = groupEnrollments.reduce(
        (sum, enrollment) => sum + enrollment.course._count.lessons,
        0,
      );

      const memberJourneys = groupEnrollments
        .map((enrollment) => journeyByCourseId.get(enrollment.courseId))
        .filter((journey): journey is JourneyWithTiers => Boolean(journey));

      const firstEnrollment = groupEnrollments[0];
      if (!firstEnrollment) {
        continue;
      }

      const completedAt = groupEnrollments.every((enrollment) => Boolean(enrollment.completedAt))
        ? new Date(
            Math.max(
              ...groupEnrollments
                .map((enrollment) => enrollment.completedAt?.getTime() ?? 0)
                .filter((value) => value > 0),
            ),
          )
        : null;

      rows.push({
        enrollmentId: firstEnrollment.id,
        enrolledAt: firstEnrollment.enrolledAt,
        completedAt,
        course: {
          id: `bundle:${group.bundle.slug}`,
          slug: group.bundle.entryCourseSlug,
          title: group.bundle.title,
          description: group.bundle.description,
          coverImageUrl: group.bundle.coverImageUrl,
          durationDays: Math.max(
            group.bundle.durationDays,
            ...groupEnrollments.map((enrollment) => enrollment.course.durationDays),
          ),
          totalLessons,
          bundleSlug: group.bundle.slug,
          bundleCourseCount: groupEnrollments.length,
        },
        journey: buildBundleJourneySnapshot({
          bundle: group.bundle,
          childId: params.childId,
          totalLessons,
          journeys: memberJourneys,
        }),
      });

      continue;
    }

    const enrollment = groupEnrollments[0];
    if (!enrollment) {
      continue;
    }

    const journey = journeyByCourseId.get(enrollment.courseId) ?? null;
    const totalTiers = journey?.tiers.length ?? 0;
    const completedTiers = journey?.tiers.filter((tier) => tier.isCompleted).length ?? 0;

    rows.push({
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      course: {
        id: enrollment.course.id,
        slug: enrollment.course.slug,
        title: enrollment.course.title,
        description: enrollment.course.description,
        coverImageUrl: resolveCourseCoverImage(
          enrollment.course.slug,
          enrollment.course.coverImageUrl,
        ),
        durationDays: enrollment.course.durationDays,
        totalLessons: enrollment.course._count.lessons,
      },
      journey: journey
        ? {
            id: journey.id,
            status: journey.status,
            seedName: journey.seedName,
            currentTierNo: journey.currentTierNo,
            currentTierProgress: journey.currentTierProgress,
            totalTiers,
            completedTiers,
            completedLessons: journey.tiers.reduce(
              (sum, tier) => sum + tier.lessonCompleted,
              0,
            ),
          }
        : null,
    });
  }

  return rows.sort((a, b) => a.enrolledAt.getTime() - b.enrolledAt.getTime());
}
