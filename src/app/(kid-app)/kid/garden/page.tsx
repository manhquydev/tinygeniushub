import { redirect } from "next/navigation";
import { KidSharedGardenDashboard } from "@/components/kid-shared-garden/KidSharedGardenDashboard";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";
import { getEnrolledCoursesForKidDashboard } from "@/modules/courses/course-service";

interface KidGardenPageProps {
  searchParams?:
    | Promise<{
        childId?: string | string[];
      }>
    | {
        childId?: string | string[];
      };
}

function readSingleQueryParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function KidGardenPage({ searchParams }: KidGardenPageProps) {
  const parent = await requireParent();

  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nickname: true,
    },
  });

  if (children.length === 0) {
    redirect("/parent/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const queryChildId = readSingleQueryParam(resolvedSearchParams?.childId);
  const activeChild = children.find((child) => child.id === queryChildId) ?? children[0]!;

  const enrolledCourses = await getEnrolledCoursesForKidDashboard({
    parentId: parent.id,
    childId: activeChild.id,
  });

  return (
    <KidSharedGardenDashboard
      childrenProfiles={children.map((child) => ({
        id: child.id,
        nickname: child.nickname,
      }))}
      activeChildId={activeChild.id}
      enrolledCourses={enrolledCourses}
    />
  );
}
