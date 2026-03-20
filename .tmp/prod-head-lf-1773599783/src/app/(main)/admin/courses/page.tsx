import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { AdminCoursesClient } from "./admin-courses-client";

export default async function AdminCoursesPage() {
  await requireAdminParent();

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { enrollments: true, lessons: true } },
    },
  });

  return <AdminCoursesClient initialCourses={courses} />;
}
