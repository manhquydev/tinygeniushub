import { prisma } from "@/lib/db";
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
  return prisma.courseEnrollment.findMany({
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

/**
 * Returns enrolled courses for a parent with the child's journey progress.
 * Used by Kid Courses Dashboard (/kid/courses).
 */
export async function getEnrolledCoursesForKidDashboard(params: {
  parentId: string;
  childId: string;
}): Promise<EnrolledCourseForKidDashboard[]> {
  const enrollments = await prisma.courseEnrollment.findMany({
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
  const journeys =
    courseIds.length > 0
      ? await prisma.childCourseJourney.findMany({
          where: {
            childId: params.childId,
            courseId: { in: courseIds },
          },
          include: {
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

  return enrollments.map((enrollment) => {
    const journey = journeyByCourseId.get(enrollment.courseId) ?? null;
    const totalTiers = journey?.tiers.length ?? 0;
    const completedTiers = journey?.tiers.filter((tier) => tier.isCompleted).length ?? 0;

    return {
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      course: {
        id: enrollment.course.id,
        slug: enrollment.course.slug,
        title: enrollment.course.title,
        description: enrollment.course.description,
        coverImageUrl: enrollment.course.coverImageUrl,
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
    };
  });
}
