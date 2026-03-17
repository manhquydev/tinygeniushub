export type PilotSkuDefinition = {
  sku: string;
  slug: string;
  courseCode: "abeka" | "littlefox" | "littlefoxcn";
  unitType: "grade" | "level";
  unitValue: string | number;
};

const PILOT_SKUS: readonly PilotSkuDefinition[] = [
  { sku: "ABEKA-K4-INTRO-4W", slug: "abeka-k4-intro-4w", courseCode: "abeka", unitType: "grade", unitValue: "k4" },
  {
    sku: "ABEKA-K4-FOUNDATION-8W",
    slug: "abeka-k4-foundation-8w",
    courseCode: "abeka",
    unitType: "grade",
    unitValue: "k4",
  },
  { sku: "ABEKA-K5-INTRO-4W", slug: "abeka-k5-intro-4w", courseCode: "abeka", unitType: "grade", unitValue: "k5" },
  {
    sku: "ABEKA-K5-FOUNDATION-8W",
    slug: "abeka-k5-foundation-8w",
    courseCode: "abeka",
    unitType: "grade",
    unitValue: "k5",
  },
  { sku: "ABEKA-G1-INTRO-4W", slug: "abeka-g1-intro-4w", courseCode: "abeka", unitType: "grade", unitValue: "g1" },
  {
    sku: "ABEKA-G1-FOUNDATION-8W",
    slug: "abeka-g1-foundation-8w",
    courseCode: "abeka",
    unitType: "grade",
    unitValue: "g1",
  },
  { sku: "LFEN-L1-STARTER-6W", slug: "lfen-l1-starter-6w", courseCode: "littlefox", unitType: "level", unitValue: 1 },
  { sku: "LFEN-L1-BUILDER-8W", slug: "lfen-l1-builder-8w", courseCode: "littlefox", unitType: "level", unitValue: 1 },
  { sku: "LFEN-L2-STARTER-6W", slug: "lfen-l2-starter-6w", courseCode: "littlefox", unitType: "level", unitValue: 2 },
  { sku: "LFEN-L2-BUILDER-8W", slug: "lfen-l2-builder-8w", courseCode: "littlefox", unitType: "level", unitValue: 2 },
  {
    sku: "LFCN-L1-STARTER-5W",
    slug: "lfcn-l1-starter-5w",
    courseCode: "littlefoxcn",
    unitType: "level",
    unitValue: 1,
  },
  {
    sku: "LFCN-L1-BUILDER-8W",
    slug: "lfcn-l1-builder-8w",
    courseCode: "littlefoxcn",
    unitType: "level",
    unitValue: 1,
  },
] as const;

const PILOT_BY_SLUG = new Map(PILOT_SKUS.map((item) => [item.slug, item]));

export function listPilotSkuDefinitions() {
  return [...PILOT_SKUS];
}

export function listPilotSkuSlugs() {
  return PILOT_SKUS.map((item) => item.slug);
}

export function getPilotSkuBySlug(slug: string) {
  return PILOT_BY_SLUG.get(slug) ?? null;
}

export function isPilotSkuSlug(slug: string) {
  return PILOT_BY_SLUG.has(slug);
}
