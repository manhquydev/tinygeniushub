import { notFound, redirect } from "next/navigation";
import { requireParent } from "@/lib/auth/require-parent";
import { CourseLessonsPlayer } from "@/components/courses/course-lessons-player";
import { getCourse, getEnrollment } from "@/modules/courses/course-service";
import { listLiveCourseIds } from "@/modules/entitlement/course-tickets";

type Props = { params: Promise<{ slug: string }> };

export default async function CourseLessonsPage({ params }: Props) {
  const { slug } = await params;

  const parent = await requireParent();

  const course = await getCourse(slug);
  if (!course) notFound();

  const ticketedIds = await listLiveCourseIds(parent.id);
  if (!course.isPublished || !ticketedIds.includes(course.id)) {
    redirect(`/courses/${slug}`);
  }

  const enrollment = await getEnrollment(course.id, parent.id);
  const sortedLessons = [...course.lessons].sort((a, b) => a.orderNo - b.orderNo);

  return (
    <CourseLessonsPlayer
      courseSlug={slug}
      courseTitle={course.title}
      lessons={sortedLessons}
      enrollmentId={enrollment?.id ?? ""}
    />
  );
}
