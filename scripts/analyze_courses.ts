import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const slugs = ["abeka", "littlefox", "littlefoxcn"];

  for (const slug of slugs) {
    console.log(`\n--- COURSE: ${slug} ---`);
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        lessons: {
          include: {
            lesson: {
              include: {
                unit: {
                  include: {
                    level: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      console.log("NOT FOUND");
      continue;
    }

    const levelCounts: Record<string, { title: string; count: number; orderNo: number }> = {};

    for (const courseLesson of course.lessons) {
      const level = courseLesson.lesson.unit.level;
      const key = level.id;
      if (!levelCounts[key]) {
        levelCounts[key] = { title: level.title, count: 0, orderNo: level.orderNo };
      }
      levelCounts[key].count++;
    }

    const sortedLevels = Object.values(levelCounts).sort((a, b) => a.orderNo - b.orderNo);

    for (const lvl of sortedLevels) {
      console.log(`Level: ${lvl.title} (order: ${lvl.orderNo}) -> ${lvl.count} lessons`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
