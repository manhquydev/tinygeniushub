export type CourseBundleSlug = "abeka" | "little-fox-en" | "little-fox-cn";

type CourseSlugMatchRule =
  | {
      type: "exact";
      value: string;
    }
  | {
      type: "prefix";
      value: string;
    };

export type CourseBundleDefinition = {
  slug: CourseBundleSlug;
  title: string;
  description: string;
  coverImageUrl: string;
  entryCourseSlug: string;
  courseSlugRules: readonly CourseSlugMatchRule[];
  legacyMonolithCourseSlugs: readonly string[];
  canonicalSplitCourseSlugPrefixes: readonly string[];
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
    entryCourseSlug: "abeka",
    courseSlugRules: [
      { type: "exact", value: "abeka" },
      { type: "prefix", value: "abeka-" },
    ],
    legacyMonolithCourseSlugs: ["abeka"],
    canonicalSplitCourseSlugPrefixes: ["abeka-"],
    priceVnd: 500000,
    durationDays: 365,
    orderNo: 1,
  },
  {
    slug: "little-fox-en",
    title: "Little Fox English",
    description: "Bộ Little Fox English đầy đủ từ Level 1 đến Level 9, mở toàn bộ nội dung.",
    coverImageUrl: "/images/courses/course_cover_littlefox.png",
    entryCourseSlug: "littlefox",
    courseSlugRules: [
      { type: "exact", value: "littlefox" },
      { type: "prefix", value: "little-fox-en-level-" },
      { type: "prefix", value: "lfen-" },
    ],
    legacyMonolithCourseSlugs: ["littlefox"],
    canonicalSplitCourseSlugPrefixes: ["lfen-"],
    priceVnd: 500000,
    durationDays: 365,
    orderNo: 2,
  },
  {
    slug: "little-fox-cn",
    title: "Little Fox Chinese",
    description: "Bộ Little Fox Chinese đầy đủ từ Level 1 đến Level 5, mua một lần học trọn bộ.",
    coverImageUrl: "/images/courses/course_cover_littlefox_cn.png",
    entryCourseSlug: "littlefoxcn",
    courseSlugRules: [
      { type: "exact", value: "littlefoxcn" },
      { type: "prefix", value: "little-fox-cn-level-" },
      { type: "prefix", value: "lfcn-" },
    ],
    legacyMonolithCourseSlugs: ["littlefoxcn"],
    canonicalSplitCourseSlugPrefixes: ["lfcn-"],
    priceVnd: 500000,
    durationDays: 365,
    orderNo: 3,
  },
];

function doesCourseSlugMatchRule(courseSlug: string, rule: CourseSlugMatchRule): boolean {
  if (rule.type === "exact") {
    return courseSlug === rule.value;
  }

  return courseSlug.startsWith(rule.value);
}

function isCourseInBundle(courseSlug: string, bundle: CourseBundleDefinition): boolean {
  return bundle.courseSlugRules.some((rule) => doesCourseSlugMatchRule(courseSlug, rule));
}

export function isLegacyMonolithCourseSlug(bundle: CourseBundleDefinition, courseSlug: string) {
  return bundle.legacyMonolithCourseSlugs.includes(courseSlug);
}

export function isCanonicalSplitCourseSlug(bundle: CourseBundleDefinition, courseSlug: string) {
  return bundle.canonicalSplitCourseSlugPrefixes.some((prefix) => courseSlug.startsWith(prefix));
}

export function listCourseBundles(): CourseBundleDefinition[] {
  return [...COURSE_BUNDLES].sort((a, b) => a.orderNo - b.orderNo);
}

export function getCourseBundleByBundleSlug(slug: string): CourseBundleDefinition | null {
  return COURSE_BUNDLES.find((bundle) => bundle.slug === slug) ?? null;
}

export function getCourseBundleByEntryCourseSlug(slug: string): CourseBundleDefinition | null {
  return COURSE_BUNDLES.find((bundle) => bundle.entryCourseSlug === slug) ?? null;
}

export function getCourseBundleByCourseSlug(courseSlug: string): CourseBundleDefinition | null {
  return COURSE_BUNDLES.find((bundle) => isCourseInBundle(courseSlug, bundle)) ?? null;
}

export function getCourseBundleByAnySlug(slug: string): CourseBundleDefinition | null {
  return getCourseBundleByBundleSlug(slug) ?? getCourseBundleByCourseSlug(slug);
}

export function getCourseBundleByRootSlug(slug: string): CourseBundleDefinition | null {
  return (
    getCourseBundleByBundleSlug(slug) ??
    getCourseBundleByEntryCourseSlug(slug) ??
    getCourseBundleByCourseSlug(slug)
  );
}

export function getBundleCourseSlugFilters(bundle: CourseBundleDefinition) {
  return bundle.courseSlugRules.map((rule) => {
    if (rule.type === "exact") {
      return {
        slug: {
          equals: rule.value,
        },
      };
    }

    return {
      slug: {
        startsWith: rule.value,
      },
    };
  });
}
