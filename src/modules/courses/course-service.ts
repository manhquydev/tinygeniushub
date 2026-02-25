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
