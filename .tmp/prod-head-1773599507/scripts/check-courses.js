const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      isPublished: true,
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
    actualLessons: c._count.lessons,
    enrollments: c._count.enrollments
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
