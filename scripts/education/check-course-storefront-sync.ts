import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";
import { getPublishedCourseBundles } from "@/modules/courses/course-bundle-service";

const prisma = new PrismaClient();
const root = process.cwd();
const reportsDir = path.join(root, "plans", "2026-03-17-education-agent-team", "reports");
const outJsonPath = path.join(reportsDir, "course-storefront-sync-report.json");
const outMdPath = path.join(reportsDir, "course-storefront-sync-report.md");

type BundleSlug = "abeka" | "little-fox-en" | "little-fox-cn";

type BundleCheckConfig = {
  bundleSlug: BundleSlug;
  rootCourseSlug: string;
  splitPrefixes: string[];
};

const BUNDLE_CHECKS: BundleCheckConfig[] = [
  {
    bundleSlug: "abeka",
    rootCourseSlug: "abeka",
    splitPrefixes: ["abeka-"],
  },
  {
    bundleSlug: "little-fox-en",
    rootCourseSlug: "littlefox",
    splitPrefixes: ["lfen-", "little-fox-en-level-"],
  },
  {
    bundleSlug: "little-fox-cn",
    rootCourseSlug: "littlefoxcn",
    splitPrefixes: ["lfcn-", "little-fox-cn-level-"],
  },
];

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function sumLessons(rows: Array<{ _count: { lessons: number } }>) {
  return rows.reduce((sum, row) => sum + row._count.lessons, 0);
}

function makeMarkdown(report: {
  generatedAt: string;
  summary: { allPassed: boolean; checkedBundles: number; passedBundles: number };
  rows: Array<{
    bundleSlug: string;
    storefrontExists: boolean;
    titleSynced: boolean;
    descriptionSynced: boolean;
    priceSynced: boolean;
    totalCoursesSynced: boolean;
    totalLessonsSynced: boolean;
    expected: {
      title: string;
      description: string;
      priceVnd: number;
      totalCourses: number;
      totalLessons: number;
    };
    actual: {
      title: string | null;
      description: string | null;
      priceVnd: number | null;
      totalCourses: number | null;
      totalLessons: number | null;
    };
  }>;
}) {
  const lines: string[] = [];
  lines.push("# Course Storefront Sync Report");
  lines.push("");
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Bundles checked: ${report.summary.checkedBundles}`);
  lines.push(`- Bundles passed: ${report.summary.passedBundles}`);
  lines.push(`- Overall: ${report.summary.allPassed ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## Per Bundle");
  lines.push(
    "| Bundle | Exists | Title | Description | Price | Total courses | Total lessons | Expected courses | Actual courses |",
  );
  lines.push("|---|---|---|---|---|---|---|---:|---:|");

  for (const row of report.rows) {
    lines.push(
      `| ${row.bundleSlug} | ${row.storefrontExists ? "PASS" : "FAIL"} | ${row.titleSynced ? "PASS" : "FAIL"} | ${row.descriptionSynced ? "PASS" : "FAIL"} | ${row.priceSynced ? "PASS" : "FAIL"} | ${row.totalCoursesSynced ? "PASS" : "FAIL"} | ${row.totalLessonsSynced ? "PASS" : "FAIL"} | ${row.expected.totalCourses} | ${row.actual.totalCourses ?? 0} |`,
    );
  }

  lines.push("");
  lines.push("## Notes");
  lines.push("- Expected title/description/price are sourced from admin-editable root course records.");
  lines.push("- Expected counts are sourced from published split courses; fallback is the root course if no split is published.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const storefrontBundles = await getPublishedCourseBundles();
  const storefrontBySlug = new Map(storefrontBundles.map((bundle) => [bundle.bundleSlug, bundle]));
  const rows: Array<{
    bundleSlug: string;
    storefrontExists: boolean;
    titleSynced: boolean;
    descriptionSynced: boolean;
    priceSynced: boolean;
    totalCoursesSynced: boolean;
    totalLessonsSynced: boolean;
    expected: {
      title: string;
      description: string;
      priceVnd: number;
      totalCourses: number;
      totalLessons: number;
    };
    actual: {
      title: string | null;
      description: string | null;
      priceVnd: number | null;
      totalCourses: number | null;
      totalLessons: number | null;
    };
  }> = [];

  for (const config of BUNDLE_CHECKS) {
    const [rootCourse, splitCourses, fallbackRootPublishedCourse] = await Promise.all([
      prisma.course.findUnique({
        where: { slug: config.rootCourseSlug },
        select: {
          title: true,
          description: true,
          priceVnd: true,
          listPriceVnd: true,
          salePriceVnd: true,
        },
      }),
      prisma.course.findMany({
        where: {
          isPublished: true,
          OR: config.splitPrefixes.map((prefix) => ({
            slug: { startsWith: prefix },
          })),
        },
        select: {
          id: true,
          _count: {
            select: { lessons: true },
          },
        },
      }),
      prisma.course.findUnique({
        where: { slug: config.rootCourseSlug },
        select: {
          id: true,
          isPublished: true,
          _count: {
            select: { lessons: true },
          },
        },
      }),
    ]);

    const expectedPricing = rootCourse
      ? resolveCourseDisplayPricing(rootCourse)
      : { salePriceVnd: 0 };
    const expectedTitle = normalizeText(rootCourse?.title);
    const expectedDescription = normalizeText(rootCourse?.description);

    let expectedTotalCourses = splitCourses.length;
    let expectedTotalLessons = sumLessons(splitCourses);
    if (expectedTotalCourses === 0 && fallbackRootPublishedCourse?.isPublished) {
      expectedTotalCourses = 1;
      expectedTotalLessons = fallbackRootPublishedCourse._count.lessons;
    }

    const storefront = storefrontBySlug.get(config.bundleSlug);
    const actualTitle = storefront?.title ?? null;
    const actualDescription = storefront?.description ?? null;
    const actualPriceVnd = storefront?.priceVnd ?? null;
    const actualTotalCourses = storefront?.totalCourses ?? null;
    const actualTotalLessons = storefront?.totalLessons ?? null;

    rows.push({
      bundleSlug: config.bundleSlug,
      storefrontExists: Boolean(storefront),
      titleSynced: Boolean(storefront) && normalizeText(actualTitle) === expectedTitle,
      descriptionSynced: Boolean(storefront) && normalizeText(actualDescription) === expectedDescription,
      priceSynced: Boolean(storefront) && actualPriceVnd === expectedPricing.salePriceVnd,
      totalCoursesSynced: Boolean(storefront) && actualTotalCourses === expectedTotalCourses,
      totalLessonsSynced: Boolean(storefront) && actualTotalLessons === expectedTotalLessons,
      expected: {
        title: expectedTitle,
        description: expectedDescription,
        priceVnd: expectedPricing.salePriceVnd,
        totalCourses: expectedTotalCourses,
        totalLessons: expectedTotalLessons,
      },
      actual: {
        title: actualTitle,
        description: actualDescription,
        priceVnd: actualPriceVnd,
        totalCourses: actualTotalCourses,
        totalLessons: actualTotalLessons,
      },
    });
  }

  const summary = {
    checkedBundles: rows.length,
    passedBundles: rows.filter(
      (row) =>
        row.storefrontExists &&
        row.titleSynced &&
        row.descriptionSynced &&
        row.priceSynced &&
        row.totalCoursesSynced &&
        row.totalLessonsSynced,
    ).length,
    allPassed: false,
  };
  summary.allPassed = summary.passedBundles === summary.checkedBundles;

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    rows,
  };

  fs.writeFileSync(outJsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(outMdPath, makeMarkdown(report));
  console.log(`Wrote ${outJsonPath}`);
  console.log(`Wrote ${outMdPath}`);
  console.log(`Storefront sync status: ${summary.allPassed ? "PASS" : "FAIL"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
