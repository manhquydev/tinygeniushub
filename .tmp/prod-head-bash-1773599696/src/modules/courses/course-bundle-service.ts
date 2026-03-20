import { prisma } from "@/lib/db";
import {
  getBundleCourseSlugFilters,
  getCourseBundleByBundleSlug,
  listCourseBundles,
  type CourseBundleDefinition,
  type CourseBundleSlug,
} from "@/modules/courses/course-bundles";

type PublishedCourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceVnd: number;
  durationDays: number;
  coverImageUrl: string | null;
  lessonCount: number;
};

type PublishedBundleCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationDays: number;
  priceVnd: number;
  coverImageUrl: string | null;
  lessonCount: number;
};

const slugCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

async function getPublishedCourses(): Promise<PublishedCourseRow[]> {
  const rows = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      priceVnd: true,
      durationDays: true,
      coverImageUrl: true,
      _count: {
        select: {
          lessons: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    priceVnd: row.priceVnd,
    durationDays: row.durationDays,
    coverImageUrl: row.coverImageUrl,
    lessonCount: row._count.lessons,
  }));
}

function mapBundleCourses(bundle: CourseBundleDefinition, rows: PublishedCourseRow[]): PublishedBundleCourse[] {
  return rows
    .filter((row) => bundle.courseSlugPrefixes.some((prefix) => row.slug.startsWith(prefix)))
    .sort((a, b) => slugCollator.compare(a.slug, b.slug))
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      durationDays: row.durationDays,
      priceVnd: row.priceVnd,
      coverImageUrl: row.coverImageUrl,
      lessonCount: row.lessonCount,
    }));
}

export type CourseBundleCatalogItem = {
  bundleSlug: CourseBundleSlug;
  title: string;
  description: string;
  coverImageUrl: string;
  entryCourseSlug: string;
  priceVnd: number;
  durationDays: number;
  totalCourses: number;
  totalLessons: number;
};

export async function getPublishedCourseBundles(): Promise<CourseBundleCatalogItem[]> {
  const rows = await getPublishedCourses();
  const bundles = listCourseBundles();

  const items: CourseBundleCatalogItem[] = [];
  for (const bundle of bundles) {
    const memberCourses = mapBundleCourses(bundle, rows);
    if (memberCourses.length === 0) {
      continue;
    }

    const durationDays = Math.max(bundle.durationDays, ...memberCourses.map((course) => course.durationDays));
    const totalLessons = memberCourses.reduce((sum, course) => sum + course.lessonCount, 0);

    items.push({
      bundleSlug: bundle.slug,
      title: bundle.title,
      description: bundle.description,
      coverImageUrl: bundle.coverImageUrl,
      entryCourseSlug: bundle.entryCourseSlug,
      priceVnd: bundle.priceVnd,
      durationDays,
      totalCourses: memberCourses.length,
      totalLessons,
    });
  }

  return items;
}

export type CourseBundleDetail = {
  bundle: CourseBundleDefinition;
  courses: PublishedBundleCourse[];
  stats: {
    totalCourses: number;
    totalLessons: number;
    durationDays: number;
    priceVnd: number;
  };
};

export async function getPublishedCourseBundleDetailBySlug(
  bundleSlug: string,
): Promise<CourseBundleDetail | null> {
  const bundle = getCourseBundleByBundleSlug(bundleSlug);
  if (!bundle) {
    return null;
  }

  const rows = await getPublishedCourses();
  const courses = mapBundleCourses(bundle, rows);
  if (courses.length === 0) {
    return null;
  }

  const durationDays = Math.max(bundle.durationDays, ...courses.map((course) => course.durationDays));
  const totalLessons = courses.reduce((sum, course) => sum + course.lessonCount, 0);

  return {
    bundle,
    courses,
    stats: {
      totalCourses: courses.length,
      totalLessons,
      durationDays,
      priceVnd: bundle.priceVnd,
    },
  };
}

export async function getPublishedCoursesByBundleSlug(bundleSlug: string) {
  const bundle = getCourseBundleByBundleSlug(bundleSlug);
  if (!bundle) {
    return {
      bundle: null,
      courses: [],
    };
  }

  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      OR: getBundleCourseSlugFilters(bundle),
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
    orderBy: {
      slug: "asc",
    },
  });

  return {
    bundle,
    courses,
  };
}
