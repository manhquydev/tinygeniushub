import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  const slugsToSplit = ["abeka", "littlefox", "littlefoxcn"];

  for (const oldSlug of slugsToSplit) {
    console.log(`\n--- Processing Course: ${oldSlug} ---`);
    const oldCourse = await prisma.course.findUnique({
      where: { slug: oldSlug },
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

    if (!oldCourse) {
      console.log(`Course ${oldSlug} not found or already split.`);
      continue;
    }

    // Group lessons by level
    const levelGroups: Record<string, { title: string, orderNo: number, lessons: any[] }> = {};

    for (const cl of oldCourse.lessons) {
      const lvl = cl.lesson.unit.level;
      if (!levelGroups[lvl.id]) {
        levelGroups[lvl.id] = { title: lvl.title, orderNo: lvl.orderNo, lessons: [] };
      }
      levelGroups[lvl.id].lessons.push(cl.lesson);
    }

    const sortedLevels = Object.values(levelGroups).sort((a, b) => a.orderNo - b.orderNo);

    for (const lvl of sortedLevels) {
      const newSlug = generateSlug(lvl.title);
      console.log(`Creating new course: ${lvl.title} (${newSlug}) with ${lvl.lessons.length} lessons`);
      
      const newCourse = await prisma.course.upsert({
        where: { slug: newSlug },
        create: {
          slug: newSlug,
          title: lvl.title,
          description: oldCourse.description,
          priceVnd: 500000, 
          durationDays: 365,
          isPublished: true, 
          coverImageUrl: oldCourse.coverImageUrl,
        },
        update: {
          title: lvl.title,
          isPublished: true,
        }
      });

      // Clear existing course lessons for this new course (if re-running script)
      await prisma.courseLesson.deleteMany({
        where: { courseId: newCourse.id }
      });

      // Sort lessons by their unit order and then lesson order
      const sortedLessons = lvl.lessons.sort((a, b) => {
        if (a.unit.orderNo !== b.unit.orderNo) return a.unit.orderNo - b.unit.orderNo;
        return a.orderNo - b.orderNo;
      });

      // Insert new CourseLesson records
      const courseLessonsData = sortedLessons.map((l, index) => ({
        courseId: newCourse.id,
        lessonId: l.id,
        orderNo: index + 1,
      }));

      await prisma.courseLesson.createMany({
        data: courseLessonsData,
      });
      
      console.log(`  -> Attached ${courseLessonsData.length} lessons to ${newCourse.slug}.`);
    }

    // After successfully transferring all lessons, delete the monolithic course.
    console.log(`Deleting old monolithic course: ${oldSlug}...`);
    await prisma.course.delete({
      where: { id: oldCourse.id },
    });
    console.log(`Deleted ${oldSlug} successfully.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
