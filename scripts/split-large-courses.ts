import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SplitLesson = {
  id: string;
  orderNo: number;
  unit: {
    orderNo: number;
  };
};

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseNonNegativeInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseOptionalNonNegativeInt(value: string | undefined) {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseOptionalDate(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

async function main() {
  const forceResetPricingOnRerun = process.env.PILOT_FORCE_RESET_PRICING_ON_RERUN === "true";
  const listPriceVnd = parseNonNegativeInt(process.env.PILOT_LIST_PRICE_VND, 299000);
  const saleDurationDays = parseNonNegativeInt(process.env.PILOT_SALE_DURATION_DAYS, 30);
  const salePriceRaw = process.env.PILOT_SALE_PRICE_VND;
  const hasSalePriceConfigured = typeof salePriceRaw === "string" && salePriceRaw.trim().length > 0;
  const salePriceCandidate = hasSalePriceConfigured ? parseOptionalNonNegativeInt(salePriceRaw) : 0;
  const configuredSaleStartsAt = parseOptionalDate(process.env.PILOT_SALE_STARTS_AT);
  const configuredSaleEndsAt = parseOptionalDate(process.env.PILOT_SALE_ENDS_AT);
  const saleStartsAtCandidate = configuredSaleStartsAt ?? new Date();
  const saleEndsAtCandidate =
    configuredSaleEndsAt ??
    new Date(saleStartsAtCandidate.getTime() + saleDurationDays * 24 * 60 * 60 * 1000);
  const allowFreeSaleWithoutWindow = process.env.PILOT_ALLOW_FREE_SALE_WITHOUT_WINDOW === "true";
  const hasExplicitSaleWindow =
    saleStartsAtCandidate &&
    saleEndsAtCandidate &&
    saleStartsAtCandidate.getTime() < saleEndsAtCandidate.getTime();
  const hasValidSaleWindow =
    (!saleStartsAtCandidate && !saleEndsAtCandidate) ||
    Boolean(hasExplicitSaleWindow);
  const salePriceVnd =
    typeof salePriceCandidate === "number" &&
    listPriceVnd > 0 &&
    salePriceCandidate < listPriceVnd &&
    (salePriceCandidate > 0 || hasExplicitSaleWindow || allowFreeSaleWithoutWindow)
      ? salePriceCandidate
      : null;
  const saleStartsAt = salePriceVnd !== null && hasValidSaleWindow ? saleStartsAtCandidate : null;
  const saleEndsAt = salePriceVnd !== null && hasValidSaleWindow ? saleEndsAtCandidate : null;

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
    const levelGroups: Record<string, { title: string; orderNo: number; lessons: SplitLesson[] }> = {};

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
          priceVnd: listPriceVnd,
          listPriceVnd,
          salePriceVnd,
          saleStartsAt,
          saleEndsAt,
          durationDays: 365,
          isPublished: true, 
          coverImageUrl: oldCourse.coverImageUrl,
        },
        update: {
          title: lvl.title,
          ...(forceResetPricingOnRerun
            ? {
                priceVnd: listPriceVnd,
                listPriceVnd,
                salePriceVnd,
                saleStartsAt,
                saleEndsAt,
              }
            : {}),
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
