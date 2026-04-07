import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  buildAbekaGradeOrderMap,
  buildScopeExpectedCountMap,
  compareOrderedLessonIds,
  groupManifestByScope,
  manifestPath,
  pickLessonIdsByRange,
  pilotIntegrityPath,
  programPath,
  readJson,
  reportsDir,
  resolveScopeSource,
  toSlug,
  validateScopeRows,
  writeJson,
} from "./pilot-sku-lib.mjs";

const prisma = new PrismaClient();
const strictMode = process.argv.includes("--strict");
const dryRun = process.argv.includes("--dry-run");
const outPath = path.join(reportsDir, "pilot-import-result.json");
const forceResetPricingOnRerun = process.env.PILOT_FORCE_RESET_PRICING_ON_RERUN === "true";

function parseNonNegativeInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseOptionalNonNegativeInt(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseOptionalDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

const DEFAULT_LIST_PRICE_VND = parseNonNegativeInt(process.env.PILOT_LIST_PRICE_VND, 299000);
const DEFAULT_SALE_DURATION_DAYS = parseNonNegativeInt(process.env.PILOT_SALE_DURATION_DAYS, 30);
const hasSalePriceConfigured =
  typeof process.env.PILOT_SALE_PRICE_VND === "string" &&
  process.env.PILOT_SALE_PRICE_VND.trim().length > 0;
const DEFAULT_SALE_PRICE_VND = hasSalePriceConfigured
  ? parseOptionalNonNegativeInt(process.env.PILOT_SALE_PRICE_VND)
  : 0;
const configuredSaleStartsAt = parseOptionalDate(process.env.PILOT_SALE_STARTS_AT);
const configuredSaleEndsAt = parseOptionalDate(process.env.PILOT_SALE_ENDS_AT);
const DEFAULT_SALE_STARTS_AT = configuredSaleStartsAt ?? new Date();
const DEFAULT_SALE_ENDS_AT =
  configuredSaleEndsAt ??
  new Date(DEFAULT_SALE_STARTS_AT.getTime() + DEFAULT_SALE_DURATION_DAYS * 24 * 60 * 60 * 1000);
const allowFreeSaleWithoutWindow = process.env.PILOT_ALLOW_FREE_SALE_WITHOUT_WINDOW === "true";
const hasExplicitSaleWindow =
  DEFAULT_SALE_STARTS_AT &&
  DEFAULT_SALE_ENDS_AT &&
  DEFAULT_SALE_STARTS_AT.getTime() < DEFAULT_SALE_ENDS_AT.getTime();
const hasValidSaleWindow =
  (!DEFAULT_SALE_STARTS_AT && !DEFAULT_SALE_ENDS_AT) ||
  Boolean(hasExplicitSaleWindow);
const normalizedSalePriceVnd =
  typeof DEFAULT_SALE_PRICE_VND === "number" &&
  DEFAULT_LIST_PRICE_VND > 0 &&
  DEFAULT_SALE_PRICE_VND < DEFAULT_LIST_PRICE_VND &&
  (DEFAULT_SALE_PRICE_VND > 0 || hasExplicitSaleWindow || allowFreeSaleWithoutWindow)
    ? DEFAULT_SALE_PRICE_VND
    : null;
const defaultCoursePricing = {
  priceVnd: DEFAULT_LIST_PRICE_VND,
  listPriceVnd: DEFAULT_LIST_PRICE_VND,
  salePriceVnd: normalizedSalePriceVnd,
  saleStartsAt:
    normalizedSalePriceVnd !== null && hasValidSaleWindow ? DEFAULT_SALE_STARTS_AT : null,
  saleEndsAt:
    normalizedSalePriceVnd !== null && hasValidSaleWindow ? DEFAULT_SALE_ENDS_AT : null,
};

function summarizeCourseCode(courseCode) {
  if (courseCode === "abeka") return "Abeka";
  if (courseCode === "littlefox") return "Little Fox English";
  if (courseCode === "littlefoxcn") return "Little Fox Chinese";
  return courseCode;
}

function buildCourseTitle(row) {
  const courseName = summarizeCourseCode(row.courseCode);
  return `${courseName} ${String(row.unitType).toUpperCase()} ${row.unitValue} - ${row.sku}`;
}

function buildDescription(row, sourceSlug, strategy) {
  return [
    `Pilot SKU ${row.sku} generated from ${sourceSlug} (${strategy}).`,
    `Scope: ${row.scopeId}.`,
    `Range: ${row.from}-${row.to} (${row.lessonOrEpisodeCount} lessons/episodes).`,
    `Pace: ${row.pacePerWeek}/week, duration ${row.weeks} weeks.`,
  ].join(" ");
}

async function main() {
  const manifest = readJson(manifestPath);
  const pilotIntegrity = readJson(pilotIntegrityPath);
  const program = readJson(programPath);

  const expectedCountByScope = buildScopeExpectedCountMap(pilotIntegrity);
  const abekaGradeOrderMap = buildAbekaGradeOrderMap(program);
  const scopes = groupManifestByScope(manifest);

  const issues = [];
  const scopePlans = [];
  const plannedCourses = [];

  for (const scope of scopes) {
    const expectedScopeTotal = expectedCountByScope.get(scope.scopeId);
    if (!Number.isInteger(expectedScopeTotal) || expectedScopeTotal <= 0) {
      issues.push({
        type: "missing_expected_scope_total",
        scopeId: scope.scopeId,
      });
      continue;
    }

    const rowIssues = validateScopeRows(scope.rows, expectedScopeTotal);
    if (rowIssues.length > 0) {
      issues.push(...rowIssues.map((issue) => ({ ...issue, scopeId: scope.scopeId })));
      continue;
    }

    let source;
    try {
      source = await resolveScopeSource(prisma, scope, expectedScopeTotal, abekaGradeOrderMap);
    } catch (error) {
      issues.push({
        type: "source_resolution_failed",
        scopeId: scope.scopeId,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    const seen = new Set();
    for (const row of scope.rows) {
      const pickedLessonIds = pickLessonIdsByRange(source.lessonIds, row);
      const duplicateIds = pickedLessonIds.filter((id) => {
        if (seen.has(id)) return true;
        seen.add(id);
        return false;
      });

      if (duplicateIds.length > 0) {
        issues.push({
          type: "duplicate_lessons_across_skus",
          scopeId: scope.scopeId,
          sku: row.sku,
          duplicateIds: duplicateIds.slice(0, 20),
        });
        continue;
      }

      const slug = toSlug(row.sku);
      plannedCourses.push({
        scopeId: scope.scopeId,
        sku: row.sku,
        slug,
        sourceSlug: source.sourceSlug,
        strategy: source.strategy,
        lessonIds: pickedLessonIds,
        row,
        sourceCourse: source.sourceCourse,
      });
    }

    scopePlans.push({
      scopeId: scope.scopeId,
      sourceSlug: source.sourceSlug,
      strategy: source.strategy,
      sourceLessonCount: source.lessonIds.length,
      skuCount: scope.rows.length,
    });
  }

  if (issues.length > 0) {
    const failResult = {
      generatedAt: new Date().toISOString(),
      dryRun,
      strictMode,
      status: "FAIL",
      summary: {
        totalScopes: scopes.length,
        issueCount: issues.length,
        plannedCourses: plannedCourses.length,
      },
      scopePlans,
      issues,
    };
    writeJson(outPath, failResult);
    console.log(`Wrote ${outPath}`);
    console.log(`Pilot import pre-check FAILED (issues=${issues.length})`);
    if (strictMode) {
      process.exitCode = 1;
    }
    return;
  }

  const writes = [];
  if (!dryRun) {
    for (const planned of plannedCourses) {
      const result = await prisma.$transaction(async (tx) => {
        const course = await tx.course.upsert({
          where: { slug: planned.slug },
          create: {
            slug: planned.slug,
            title: buildCourseTitle(planned.row),
            description: buildDescription(planned.row, planned.sourceSlug, planned.strategy),
            priceVnd: defaultCoursePricing.priceVnd,
            listPriceVnd: defaultCoursePricing.listPriceVnd,
            salePriceVnd: defaultCoursePricing.salePriceVnd,
            saleStartsAt: defaultCoursePricing.saleStartsAt,
            saleEndsAt: defaultCoursePricing.saleEndsAt,
            durationDays: Math.max(7, Number(planned.row.weeks) * 7),
            isPublished: false,
            coverImageUrl: planned.sourceCourse.coverImageUrl,
          },
          update: {
            title: buildCourseTitle(planned.row),
            description: buildDescription(planned.row, planned.sourceSlug, planned.strategy),
            ...(forceResetPricingOnRerun
              ? {
                  priceVnd: defaultCoursePricing.priceVnd,
                  listPriceVnd: defaultCoursePricing.listPriceVnd,
                  salePriceVnd: defaultCoursePricing.salePriceVnd,
                  saleStartsAt: defaultCoursePricing.saleStartsAt,
                  saleEndsAt: defaultCoursePricing.saleEndsAt,
                }
              : {}),
            durationDays: Math.max(7, Number(planned.row.weeks) * 7),
            coverImageUrl: planned.sourceCourse.coverImageUrl,
          },
          select: { id: true, slug: true },
        });

        await tx.courseLesson.deleteMany({
          where: { courseId: course.id },
        });

        await tx.courseLesson.createMany({
          data: planned.lessonIds.map((lessonId, index) => ({
            courseId: course.id,
            lessonId,
            orderNo: index + 1,
          })),
        });

        const actual = await tx.course.findUnique({
          where: { id: course.id },
          select: {
            lessons: {
              orderBy: { orderNo: "asc" },
              select: { lessonId: true },
            },
          },
        });

        const actualLessonIds = (actual?.lessons || []).map((item) => item.lessonId);
        const comparison = compareOrderedLessonIds(planned.lessonIds, actualLessonIds);
        return {
          slug: course.slug,
          sku: planned.sku,
          expectedCount: planned.lessonIds.length,
          actualCount: actualLessonIds.length,
          exactMatch: comparison.exactMatch,
          firstOrderMismatchIndex: comparison.firstOrderMismatchIndex,
          missingLessonCount: comparison.missingLessonIds.length,
          extraLessonCount: comparison.extraLessonIds.length,
        };
      });

      writes.push(result);
    }
  }

  const writeIssues = writes
    .filter((item) => !item.exactMatch)
    .map((item) => ({
      type: "post_write_mismatch",
      sku: item.sku,
      slug: item.slug,
      expectedCount: item.expectedCount,
      actualCount: item.actualCount,
      firstOrderMismatchIndex: item.firstOrderMismatchIndex,
      missingLessonCount: item.missingLessonCount,
      extraLessonCount: item.extraLessonCount,
    }));

  const status = writeIssues.length === 0 ? "PASS" : "FAIL";
  const result = {
    generatedAt: new Date().toISOString(),
    dryRun,
    strictMode,
    status,
    summary: {
      totalScopes: scopes.length,
      totalCourses: plannedCourses.length,
      writtenCourses: dryRun ? 0 : writes.length,
      issueCount: writeIssues.length,
    },
    scopePlans,
    plannedCourses: plannedCourses.map((item) => ({
      scopeId: item.scopeId,
      sku: item.sku,
      slug: item.slug,
      sourceSlug: item.sourceSlug,
      strategy: item.strategy,
      expectedCount: item.lessonIds.length,
    })),
    writes,
    issues: writeIssues,
  };

  writeJson(outPath, result);
  console.log(`Wrote ${outPath}`);
  console.log(`Pilot import status: ${status} (courses=${plannedCourses.length}, issues=${writeIssues.length})`);

  if (strictMode && status !== "PASS") {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
