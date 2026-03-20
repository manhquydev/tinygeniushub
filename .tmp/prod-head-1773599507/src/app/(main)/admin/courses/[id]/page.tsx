import { notFound } from "next/navigation";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { AdminCourseDetailClient } from "./admin-course-detail-client";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminParent();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { orderNo: "asc" },
        include: {
          lesson: {
            select: {
              id: true,
              slug: true,
              title: true,
              estimatedMinutes: true,
              trialEnabled: true,
              videoStatus: true,
              _count: { select: { activities: true } },
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) notFound();

  return <AdminCourseDetailClient course={course} />;
}
