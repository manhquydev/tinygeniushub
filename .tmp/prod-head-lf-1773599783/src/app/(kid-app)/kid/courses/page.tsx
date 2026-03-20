import { redirect } from "next/navigation";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { getEnrolledCoursesForKidDashboard } from "@/modules/courses/course-service";
import { KidCoursesDashboard } from "@/components/kid-courses/KidCoursesDashboard";

interface KidCoursesPageProps {
  searchParams?:
    | Promise<{ childId?: string | string[] }>
    | { childId?: string | string[] };
}

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function KidCoursesPage({ searchParams }: KidCoursesPageProps) {
  const parent = await requireParent();

  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true, avatarId: true },
  });

  if (children.length === 0) {
    redirect("/parent/dashboard");
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const queryChildId = readSingleParam(resolvedParams?.childId);
  const activeChild = children.find((child) => child.id === queryChildId) ?? children[0]!;

  const enrolledCourses = await getEnrolledCoursesForKidDashboard({
    parentId: parent.id,
    childId: activeChild.id,
  });

  return (
    <KidCoursesDashboard
      childrenProfiles={children.map((child) => ({
        id: child.id,
        nickname: child.nickname,
        avatarId: child.avatarId,
      }))}
      activeChildId={activeChild.id}
      enrolledCourses={enrolledCourses}
    />
  );
}
