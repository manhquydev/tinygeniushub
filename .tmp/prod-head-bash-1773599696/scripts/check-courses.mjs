import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    select: {
      slug: true,
      title: true,
      isPublished: true,
      totalLessons: true,
      _count: {
        select: { lessons: true, enrollments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  console.table(courses.map(c => ({
    slug: c.slug,
    title: c.title,
    published: c.isPublished,
    totalLessons: c.totalLessons,
    actualLessons: c._count.lessons,
    enrollments: c._count.enrollments
  })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
