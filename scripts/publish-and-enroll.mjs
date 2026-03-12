import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Publish all courses
  await prisma.course.updateMany({
    data: { isPublished: true }
  });
  console.log("Published all courses.");

  // 2. Find demo parent
  const demoParent = await prisma.user.findUnique({
    where: { email: 'demo.parent@cungcontuhoc.vn' }
  });

  if (!demoParent) {
    console.log("Demo parent not found.");
    return;
  }

  // 3. Enroll demo parent in all courses if not already enrolled
  const courses = await prisma.course.findMany();
  for (const course of courses) {
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_parentId: {
          courseId: course.id,
          parentId: demoParent.id
        }
      }
    });

    if (!existing) {
      await prisma.courseEnrollment.create({
        data: {
          courseId: course.id,
          parentId: demoParent.id
        }
      });
      console.log(`Enrolled demo.parent in ${course.title}`);
    } else {
      console.log(`demo.parent already enrolled in ${course.title}`);
    }
  }

  // 4. Create dummy child journey if needed, but enrollment might automatically do it or KidDashboard might handle empty journey. 
  // Wait, wait, kid dashboard requires a journey to show progress? Let's check `KidCoursesDashboard.tsx`
  // Actually KidCoursesDashboard shows "Chưa bắt đầu" if journey is null.
}

main().catch(console.error).finally(() => prisma.$disconnect());
