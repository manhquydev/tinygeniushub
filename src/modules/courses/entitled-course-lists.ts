import { prisma } from "@/lib/db";
import { resolveCourseCoverImage } from "@/modules/courses/course-media";
import { courseCatalogKey } from "@/modules/entitlement/catalog-key";
import { listLiveCourseIds } from "@/modules/entitlement/course-tickets";

const courseSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  coverImageUrl: true,
  durationDays: true,
  priceVnd: true,
  listPriceVnd: true,
  salePriceVnd: true,
  saleStartsAt: true,
  saleEndsAt: true,
  _count: { select: { lessons: true } },
} as const;

export type EntitledCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  durationDays: number;
  totalLessons: number;
  priceVnd: number;
  listPriceVnd: number | null;
  salePriceVnd: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
};

export type EntitledChildJourney = {
  id: string;
  status: string;
  seedName: string;
  currentTierNo: number;
  currentTierProgress: number;
  totalTiers: number;
  completedTiers: number;
  completedLessons: number;
};

export type EntitledCourseForChild = {
  course: EntitledCourse;
  journey: EntitledChildJourney | null;
};

export type EntitledCourseForParent = {
  course: EntitledCourse;
  validFrom: Date;
};

function mapCourse(row: {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  durationDays: number;
  priceVnd: number;
  listPriceVnd: number | null;
  salePriceVnd: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
  _count: { lessons: number };
}): EntitledCourse {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    coverImageUrl: resolveCourseCoverImage(row.slug, row.coverImageUrl),
    durationDays: row.durationDays,
    totalLessons: row._count.lessons,
    priceVnd: row.priceVnd,
    listPriceVnd: row.listPriceVnd,
    salePriceVnd: row.salePriceVnd,
    saleStartsAt: row.saleStartsAt,
    saleEndsAt: row.saleEndsAt,
  };
}

function earliestValidFromByCourseId(
  tickets: Array<{ validFrom: Date; offering: { catalogKey: string } }>,
) {
  const byCourseId = new Map<string, number>();
  for (const ticket of tickets) {
    const catalogKey = ticket.offering.catalogKey;
    const prefix = "course:";
    if (!catalogKey.startsWith(prefix) || catalogKey.includes(":level:")) {
      continue;
    }
    const courseId = catalogKey.slice(prefix.length);
    const time = ticket.validFrom.getTime();
    const previous = byCourseId.get(courseId);
    if (previous == null || time < previous) {
      byCourseId.set(courseId, time);
    }
  }
  return byCourseId;
}

export async function listEntitledCoursesForParent(parentId: string): Promise<EntitledCourseForParent[]> {
  const courseIds = await listLiveCourseIds(parentId);
  if (courseIds.length === 0) {
    return [];
  }

  const [rows, tickets] = await Promise.all([
    prisma.course.findMany({
      where: { id: { in: courseIds }, isPublished: true },
      select: courseSelect,
    }),
    prisma.entitlement.findMany({
      where: {
        parentId,
        offering: { catalogKey: { in: courseIds.map(courseCatalogKey) } },
      },
      select: {
        validFrom: true,
        offering: { select: { catalogKey: true } },
      },
    }),
  ]);

  const validFromByCourseId = earliestValidFromByCourseId(tickets);

  return rows
    .map((row) => ({
      course: mapCourse(row),
      validFrom: new Date(validFromByCourseId.get(row.id) ?? 0),
    }))
    .sort((a, b) => {
      const byDate = a.validFrom.getTime() - b.validFrom.getTime();
      if (byDate !== 0) {
        return byDate;
      }
      return a.course.title.localeCompare(b.course.title, "en", {
        numeric: true,
        sensitivity: "base",
      });
    });
}


export async function listEntitledCoursesForChild(params: {
  parentId: string;
  childId: string;
}): Promise<EntitledCourseForChild[]> {
  const entitled = await listEntitledCoursesForParent(params.parentId);
  if (entitled.length === 0) {
    return [];
  }

  const courseIds = entitled.map((row) => row.course.id);
  const journeys = await prisma.childCourseJourney.findMany({
    where: {
      childId: params.childId,
      courseId: { in: courseIds },
    },
    select: {
      id: true,
      courseId: true,
      status: true,
      seedName: true,
      currentTierNo: true,
      currentTierProgress: true,
      tiers: {
        select: {
          isCompleted: true,
          lessonCompleted: true,
        },
      },
    },
  });
  const journeyByCourseId = new Map(journeys.map((journey) => [journey.courseId, journey]));

  return entitled.map(({ course }) => {
    const journey = journeyByCourseId.get(course.id);
    return {
      course,
      journey: journey
        ? {
            id: journey.id,
            status: journey.status,
            seedName: journey.seedName,
            currentTierNo: journey.currentTierNo,
            currentTierProgress: journey.currentTierProgress,
            totalTiers: journey.tiers.length,
            completedTiers: journey.tiers.filter((tier) => tier.isCompleted).length,
            completedLessons: journey.tiers.reduce((sum, tier) => sum + tier.lessonCompleted, 0),
          }
        : null,
    };
  });
}
