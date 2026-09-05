import { listLiveCourseIds } from "@/modules/entitlement/course-tickets";
import { DomainError } from "@/modules/platform/errors";

export async function assertParentHasCourseTicket(input: {
  parentId: string;
  courseId: string;
}) {
  const courseIds = await listLiveCourseIds(input.parentId);
  if (!courseIds.includes(input.courseId)) {
    throw new DomainError(
      "Household ticket required for this course",
      403,
      "COURSE_TICKET_REQUIRED",
    );
  }
}
