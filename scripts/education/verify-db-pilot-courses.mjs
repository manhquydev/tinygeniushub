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
const outPath = path.join(reportsDir, "pilot-db-integrity.json");

async function main() {
  const manifest = readJson(manifestPath);
  const pilotIntegrity = readJson(pilotIntegrityPath);
  const program = readJson(programPath);

  const expectedCountByScope = buildScopeExpectedCountMap(pilotIntegrity);
  const abekaGradeOrderMap = buildAbekaGradeOrderMap(program);
  const scopes = groupManifestByScope(manifest);

  const checks = [];
  const issues = [];

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

    for (const row of scope.rows) {
      const slug = toSlug(row.sku);
      const expectedLessonIds = pickLessonIdsByRange(source.lessonIds, row);

      const course = await prisma.course.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          lessons: {
            orderBy: { orderNo: "asc" },
            select: {
              lessonId: true,
              orderNo: true,
            },
          },
        },
      });

      if (!course) {
        issues.push({
          type: "missing_course",
          scopeId: scope.scopeId,
          sku: row.sku,
          slug,
        });
        checks.push({
          scopeId: scope.scopeId,
          sku: row.sku,
          slug,
          status: "missing_course",
          expectedCount: expectedLessonIds.length,
        });
        continue;
      }

      const actualLessonIds = course.lessons.map((item) => item.lessonId);
      const comparison = compareOrderedLessonIds(expectedLessonIds, actualLessonIds);

      let contiguous = true;
      for (let i = 0; i < course.lessons.length; i += 1) {
        const expectedOrderNo = i + 1;
        if (course.lessons[i].orderNo !== expectedOrderNo) {
          contiguous = false;
          break;
        }
      }

      if (!contiguous) {
        issues.push({
          type: "order_not_contiguous",
          scopeId: scope.scopeId,
          sku: row.sku,
          slug,
        });
      }

      if (!comparison.exactMatch) {
        issues.push({
          type: "lesson_payload_mismatch",
          scopeId: scope.scopeId,
          sku: row.sku,
          slug,
          expectedCount: comparison.expectedCount,
          actualCount: comparison.actualCount,
          missingLessonCount: comparison.missingLessonIds.length,
          extraLessonCount: comparison.extraLessonIds.length,
          firstOrderMismatchIndex: comparison.firstOrderMismatchIndex,
          sampleMissingLessonIds: comparison.missingLessonIds.slice(0, 10),
          sampleExtraLessonIds: comparison.extraLessonIds.slice(0, 10),
        });
      }

      checks.push({
        scopeId: scope.scopeId,
        sku: row.sku,
        slug,
        status: contiguous && comparison.exactMatch ? "ok" : "issue",
        sourceSlug: source.sourceSlug,
        sourceStrategy: source.strategy,
        expectedCount: comparison.expectedCount,
        actualCount: comparison.actualCount,
        contiguous,
        exactMatch: comparison.exactMatch,
        missingLessonCount: comparison.missingLessonIds.length,
        extraLessonCount: comparison.extraLessonIds.length,
        firstOrderMismatchIndex: comparison.firstOrderMismatchIndex,
      });
    }
  }

  const summary = {
    totalSkus: manifest.skus?.length ?? 0,
    issueCount: issues.length,
    allPassed: issues.length === 0,
    strictMode,
  };

  const output = {
    generatedAt: new Date().toISOString(),
    manifestPath: path.relative(process.cwd(), manifestPath).replaceAll("\\", "/"),
    summary,
    checks,
    issues,
  };

  writeJson(outPath, output);
  console.log(`Wrote ${outPath}`);
  console.log(`DB integrity status: ${summary.allPassed ? "PASS" : "FAIL"} (issues=${summary.issueCount})`);

  if (strictMode && !summary.allPassed) {
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
