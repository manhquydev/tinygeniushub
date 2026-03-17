import { prisma } from "@/lib/db";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";
import {
  getBundleCourseSlugFilters,
  getCourseBundleByBundleSlug,
  isCanonicalSplitCourseSlug,
  isLegacyMonolithCourseSlug,
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
  listPriceVnd: number | null;
  salePriceVnd: number | null;
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

type BundleMetadataSourceRow = {
  slug: string;
  title: string;
  description: string;
  priceVnd: number;
  listPriceVnd: number | null;
  salePriceVnd: number | null;
  durationDays: number;
  coverImageUrl: string | null;
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
      listPriceVnd: true,
      salePriceVnd: true,
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
    listPriceVnd: row.listPriceVnd,
    salePriceVnd: row.salePriceVnd,
    durationDays: row.durationDays,
    coverImageUrl: row.coverImageUrl,
    lessonCount: row._count.lessons,
  }));
}

async function getBundleMetadataSourceRows(): Promise<Map<string, BundleMetadataSourceRow>> {
  const bundles = listCourseBundles();
  const entrySlugs = bundles.map((bundle) => bundle.entryCourseSlug);
  const rows = await prisma.course.findMany({
    where: {
      slug: {
        in: entrySlugs,
      },
    },
    select: {
      slug: true,
      title: true,
      description: true,
      priceVnd: true,
      listPriceVnd: true,
      salePriceVnd: true,
      durationDays: true,
      coverImageUrl: true,
    },
  });

  return new Map(rows.map((row) => [row.slug, row]));
}

function isNonEmptyString(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveBundleDefinitionForDisplay(
  bundle: CourseBundleDefinition,
  metadataSource: BundleMetadataSourceRow | null,
): CourseBundleDefinition {
  if (!metadataSource) {
    return bundle;
  }

  const pricing = resolveCourseDisplayPricing(metadataSource);

  return {
    ...bundle,
    title: isNonEmptyString(metadataSource.title) ? metadataSource.title.trim() : bundle.title,
    description: isNonEmptyString(metadataSource.description)
      ? metadataSource.description.trim()
      : bundle.description,
    coverImageUrl: metadataSource.coverImageUrl ?? bundle.coverImageUrl,
    priceVnd: pricing.salePriceVnd,
    durationDays: Math.max(bundle.durationDays, metadataSource.durationDays),
  };
}

function sortBySlug<T extends { slug: string }>(rows: T[]) {
  return [...rows].sort((a, b) => slugCollator.compare(a.slug, b.slug));
}

function selectCanonicalBundleCourses<T extends { slug: string }>(
  bundle: CourseBundleDefinition,
  rows: T[],
) {
  const splitRows = rows.filter((row) => isCanonicalSplitCourseSlug(bundle, row.slug));
  if (splitRows.length > 0) {
    return sortBySlug(splitRows);
  }

  const nonLegacyRows = rows.filter((row) => !isLegacyMonolithCourseSlug(bundle, row.slug));
  if (nonLegacyRows.length > 0) {
    return sortBySlug(nonLegacyRows);
  }

  return sortBySlug(rows);
}

function selectLegacyMonolithCourses<T extends { slug: string }>(
  bundle: CourseBundleDefinition,
  rows: T[],
) {
  return sortBySlug(rows.filter((row) => isLegacyMonolithCourseSlug(bundle, row.slug)));
}

function mapBundleCourses(bundle: CourseBundleDefinition, rows: PublishedCourseRow[]) {
  const filters = getBundleCourseSlugFilters(bundle);
  const matchedRows = rows.filter((row) =>
    filters.some((filter) => {
      if ("equals" in filter.slug) {
        return row.slug === filter.slug.equals;
      }
      return row.slug.startsWith(filter.slug.startsWith);
    }),
  );

  const canonicalRows = selectCanonicalBundleCourses(bundle, matchedRows);
  const legacyRows = selectLegacyMonolithCourses(bundle, matchedRows);

  const toBundleCourse = (row: PublishedCourseRow): PublishedBundleCourse => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    durationDays: row.durationDays,
    priceVnd: row.priceVnd,
    coverImageUrl: row.coverImageUrl,
    lessonCount: row.lessonCount,
  });

  return {
    canonicalCourses: canonicalRows.map(toBundleCourse),
    legacyCourses: legacyRows.map(toBundleCourse),
    hasSplitCatalog:
      canonicalRows.length > 0 &&
      canonicalRows.every((row) => isCanonicalSplitCourseSlug(bundle, row.slug)),
  };
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
  hasSplitCatalog: boolean;
  legacyMonolithCourseCount: number;
};

export async function getPublishedCourseBundles(): Promise<CourseBundleCatalogItem[]> {
  const [rows, metadataSourceRows] = await Promise.all([
    getPublishedCourses(),
    getBundleMetadataSourceRows(),
  ]);
  const bundles = listCourseBundles();

  const items: CourseBundleCatalogItem[] = [];
  for (const baseBundle of bundles) {
    const bundle = resolveBundleDefinitionForDisplay(
      baseBundle,
      metadataSourceRows.get(baseBundle.entryCourseSlug) ?? null,
    );
    const membership = mapBundleCourses(baseBundle, rows);
    if (membership.canonicalCourses.length === 0) {
      continue;
    }

    const durationDays = Math.max(
      bundle.durationDays,
      ...membership.canonicalCourses.map((course) => course.durationDays),
    );
    const totalLessons = membership.canonicalCourses.reduce(
      (sum, course) => sum + course.lessonCount,
      0,
    );

    items.push({
      bundleSlug: bundle.slug,
      title: bundle.title,
      description: bundle.description,
      coverImageUrl: bundle.coverImageUrl,
      entryCourseSlug: bundle.entryCourseSlug,
      priceVnd: bundle.priceVnd,
      durationDays,
      totalCourses: membership.canonicalCourses.length,
      totalLessons,
      hasSplitCatalog: membership.hasSplitCatalog,
      legacyMonolithCourseCount: membership.legacyCourses.length,
    });
  }

  return items;
}

export type CourseBundleDetail = {
  bundle: CourseBundleDefinition;
  courses: PublishedBundleCourse[];
  legacyCourses: PublishedBundleCourse[];
  hasSplitCatalog: boolean;
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
  const baseBundle = getCourseBundleByBundleSlug(bundleSlug);
  if (!baseBundle) {
    return null;
  }

  const [rows, metadataSourceRows] = await Promise.all([
    getPublishedCourses(),
    getBundleMetadataSourceRows(),
  ]);
  const bundle = resolveBundleDefinitionForDisplay(
    baseBundle,
    metadataSourceRows.get(baseBundle.entryCourseSlug) ?? null,
  );
  const membership = mapBundleCourses(baseBundle, rows);
  if (membership.canonicalCourses.length === 0) {
    return null;
  }

  const durationDays = Math.max(
    bundle.durationDays,
    ...membership.canonicalCourses.map((course) => course.durationDays),
  );
  const totalLessons = membership.canonicalCourses.reduce(
    (sum, course) => sum + course.lessonCount,
    0,
  );

  return {
    bundle,
    courses: membership.canonicalCourses,
    legacyCourses: membership.legacyCourses,
    hasSplitCatalog: membership.hasSplitCatalog,
    stats: {
      totalCourses: membership.canonicalCourses.length,
      totalLessons,
      durationDays,
      priceVnd: bundle.priceVnd,
    },
  };
}

export async function getPublishedCoursesByBundleSlug(bundleSlug: string) {
  const baseBundle = getCourseBundleByBundleSlug(bundleSlug);
  if (!baseBundle) {
    return {
      bundle: null,
      courses: [],
      legacyCourses: [],
    };
  }

  const metadataSourceRows = await getBundleMetadataSourceRows();
  const bundle = resolveBundleDefinitionForDisplay(
    baseBundle,
    metadataSourceRows.get(baseBundle.entryCourseSlug) ?? null,
  );

  const matchedCourses = await prisma.course.findMany({
    where: {
      isPublished: true,
      OR: getBundleCourseSlugFilters(baseBundle),
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

  const courses = selectCanonicalBundleCourses(baseBundle, matchedCourses);
  const legacyCourses = selectLegacyMonolithCourses(baseBundle, matchedCourses);

  return {
    bundle,
    courses,
    legacyCourses,
  };
}
