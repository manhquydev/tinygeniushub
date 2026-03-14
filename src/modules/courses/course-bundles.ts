export type CourseBundleSlug = "abeka" | "little-fox-en" | "little-fox-cn";

export type CourseBundleDefinition = {
  slug: CourseBundleSlug;
  title: string;
  description: string;
  coverImageUrl: string;
  entryCourseSlug: string;
  courseSlugPrefixes: readonly string[];
  priceVnd: number;
  durationDays: number;
  orderNo: number;
};

const COURSE_BUNDLES: readonly CourseBundleDefinition[] = [
  {
    slug: "abeka",
    title: "Abeka",
    description: "Bộ Abeka đầy đủ từ K4 đến G12, mua một lần mở trọn bộ lộ trình.",
    coverImageUrl: "/images/courses/course_cover_abeka.png",
    entryCourseSlug: "abeka-k4",
    courseSlugPrefixes: ["abeka-"],
    priceVnd: 500000,
    durationDays: 365,
    orderNo: 1,
  },
  {
    slug: "little-fox-en",
    title: "Little Fox English",
    description: "Bộ Little Fox English đầy đủ từ Level 1 đến Level 9, mở toàn bộ nội dung.",
    coverImageUrl: "/images/courses/course_cover_littlefox.png",
    entryCourseSlug: "little-fox-en-level-1",
    courseSlugPrefixes: ["little-fox-en-"],
    priceVnd: 500000,
    durationDays: 365,
    orderNo: 2,
  },
  {
    slug: "little-fox-cn",
    title: "Little Fox Chinese",
    description: "Bộ Little Fox Chinese đầy đủ từ Level 1 đến Level 5, mua một lần học trọn bộ.",
    coverImageUrl: "/images/courses/course_cover_littlefox_cn.png",
    entryCourseSlug: "little-fox-cn-level-1",
    courseSlugPrefixes: ["little-fox-cn-"],
    priceVnd: 500000,
    durationDays: 365,
    orderNo: 3,
  },
];

function isCourseInBundle(courseSlug: string, bundle: CourseBundleDefinition): boolean {
  return bundle.courseSlugPrefixes.some((prefix) => courseSlug.startsWith(prefix));
}

export function listCourseBundles(): CourseBundleDefinition[] {
  return [...COURSE_BUNDLES].sort((a, b) => a.orderNo - b.orderNo);
}

export function getCourseBundleByBundleSlug(slug: string): CourseBundleDefinition | null {
  return COURSE_BUNDLES.find((bundle) => bundle.slug === slug) ?? null;
}

export function getCourseBundleByCourseSlug(courseSlug: string): CourseBundleDefinition | null {
  return COURSE_BUNDLES.find((bundle) => isCourseInBundle(courseSlug, bundle)) ?? null;
}

export function getCourseBundleByAnySlug(slug: string): CourseBundleDefinition | null {
  return getCourseBundleByBundleSlug(slug) ?? getCourseBundleByCourseSlug(slug);
}

export function getBundleCourseSlugFilters(bundle: CourseBundleDefinition) {
  return bundle.courseSlugPrefixes.map((prefix) => ({
    slug: {
      startsWith: prefix,
    },
  }));
}
