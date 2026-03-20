import { notFound, redirect } from "next/navigation";
import { requireParent } from "@/lib/auth/require-parent";
import { getCourse, getEnrollment } from "@/modules/courses/course-service";
import { CourseLessonsPlayer } from "@/components/courses/course-lessons-player";

type Props = { params: Promise<{ slug: string }> };

export default async function CourseLessonsPage({ params }: Props) {
  const { slug } = await params;

  const parent = await requireParent();

  const course = await getCourse(slug);
  if (!course) notFound();

  const enrollment = await getEnrollment(course.id, parent.id);
  if (!enrollment) redirect(`/courses/${slug}`);

  const sortedLessons = [...course.lessons].sort((a, b) => a.orderNo - b.orderNo);

  return (
    <CourseLessonsPlayer
      courseSlug={slug}
      courseTitle={course.title}
      lessons={sortedLessons}
      enrollmentId={enrollment.id}
    />
  );
}
