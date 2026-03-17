import fs from "node:fs";
import path from "node:path";

export const rootDir = process.cwd();
export const reportsDir = path.join(rootDir, "plans", "2026-03-17-education-agent-team", "reports");
export const manifestPath = path.join(reportsDir, "pilot-sku-manifest.json");
export const pilotIntegrityPath = path.join(reportsDir, "split-integrity-pilot.json");
export const programPath = path.join(rootDir, "docs", "api", "program-bootstrap", "three-courses-program.json");

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

export function toSlug(input) {
  return String(input).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeToken(input) {
  return String(input).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function buildScopeExpectedCountMap(pilotIntegrity) {
  const map = new Map();
  for (const check of pilotIntegrity.checks || []) {
    map.set(check.scopeId, Number(check.totalCount) || 0);
  }
  return map;
}

export function buildAbekaGradeOrderMap(program) {
  const abeka = (program.courses || []).find((course) => course.courseCode === "abeka");
  if (!abeka) {
    return new Map();
  }
  const map = new Map();
  (abeka.grades || []).forEach((grade, index) => {
    map.set(String(grade.gradeCode).toLowerCase(), index + 1);
  });
  return map;
}

export function groupManifestByScope(manifest) {
  const grouped = new Map();
  for (const row of manifest.skus || []) {
    if (!grouped.has(row.scopeId)) {
      grouped.set(row.scopeId, []);
    }
    grouped.get(row.scopeId).push(row);
  }

  const scopes = [];
  for (const [scopeId, rows] of grouped.entries()) {
    const sorted = [...rows].sort((a, b) => a.from - b.from);
    const first = sorted[0];
    scopes.push({
      scopeId,
      courseCode: first.courseCode,
      unitType: first.unitType,
      unitValue: first.unitValue,
      rows: sorted,
    });
  }

  return scopes;
}

export function validateScopeRows(scopeRows, expectedTotalCount) {
  const issues = [];
  let previousTo = 0;

  for (const row of scopeRows) {
    if (!Number.isInteger(row.from) || !Number.isInteger(row.to) || row.from > row.to) {
      issues.push({
        type: "invalid_range",
        sku: row.sku,
        from: row.from,
        to: row.to,
      });
      continue;
    }

    const expectedByRange = row.to - row.from + 1;
    if (expectedByRange !== row.lessonOrEpisodeCount) {
      issues.push({
        type: "count_mismatch_with_range",
        sku: row.sku,
        lessonOrEpisodeCount: row.lessonOrEpisodeCount,
        rangeCount: expectedByRange,
      });
    }

    if (row.from !== previousTo + 1) {
      issues.push({
        type: "range_gap_or_overlap",
        sku: row.sku,
        expectedFrom: previousTo + 1,
        actualFrom: row.from,
      });
    }

    if (row.to > expectedTotalCount) {
      issues.push({
        type: "range_out_of_scope",
        sku: row.sku,
        to: row.to,
        expectedTotalCount,
      });
    }

    previousTo = row.to;
  }

  return issues;
}

function getDedicatedScopeSlug(scope) {
  if (scope.courseCode === "abeka" && scope.unitType === "grade") {
    return `abeka-${String(scope.unitValue).toLowerCase()}`;
  }
  if (scope.courseCode === "littlefox" && scope.unitType === "level") {
    return `little-fox-en-level-${String(scope.unitValue)}`;
  }
  if (scope.courseCode === "littlefoxcn" && scope.unitType === "level") {
    return `little-fox-cn-level-${String(scope.unitValue)}`;
  }
  return null;
}

function getScopeLevelOrder(scope, abekaGradeOrderMap) {
  if (scope.courseCode === "abeka" && scope.unitType === "grade") {
    return abekaGradeOrderMap.get(String(scope.unitValue).toLowerCase()) ?? null;
  }
  if (scope.unitType === "level") {
    const asNumber = Number(scope.unitValue);
    return Number.isInteger(asNumber) ? asNumber : null;
  }
  return null;
}

function isLevelTitleMatch(scope, levelTitle) {
  const token = normalizeToken(levelTitle);
  if (scope.courseCode === "abeka") {
    return token === normalizeToken(scope.unitValue);
  }
  if (scope.unitType === "level") {
    const unitToken = normalizeToken(scope.unitValue);
    return token.includes(`level${unitToken}`) || token.endsWith(unitToken);
  }
  return false;
}

async function fetchCourseBySlug(prisma, slug, includeNested) {
  return prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      priceVnd: true,
      listPriceVnd: true,
      salePriceVnd: true,
      durationDays: true,
      isPublished: true,
      coverImageUrl: true,
      lessons: includeNested
        ? {
            orderBy: { orderNo: "asc" },
            select: {
              lessonId: true,
              orderNo: true,
              lesson: {
                select: {
                  orderNo: true,
                  unit: {
                    select: {
                      orderNo: true,
                      level: {
                        select: {
                          orderNo: true,
                          title: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }
        : {
            orderBy: { orderNo: "asc" },
            select: { lessonId: true, orderNo: true },
          },
    },
  });
}

export async function resolveScopeSource(prisma, scope, expectedTotalCount, abekaGradeOrderMap) {
  const dedicatedSlug = getDedicatedScopeSlug(scope);
  if (dedicatedSlug) {
    const dedicated = await fetchCourseBySlug(prisma, dedicatedSlug, false);
    if (dedicated) {
      const dedicatedLessonIds = dedicated.lessons.map((item) => item.lessonId);
      if (dedicatedLessonIds.length !== expectedTotalCount) {
        throw new Error(
          `Dedicated scope source mismatch for ${scope.scopeId}. slug=${dedicatedSlug} lessons=${dedicatedLessonIds.length}, expected=${expectedTotalCount}`,
        );
      }
      return {
        sourceCourse: dedicated,
        sourceSlug: dedicated.slug,
        strategy: "dedicated_scope_course",
        lessonIds: dedicatedLessonIds,
      };
    }
  }

  const monolith = await fetchCourseBySlug(prisma, scope.courseCode, true);
  if (!monolith) {
    throw new Error(`Missing source course for ${scope.scopeId}. Tried ${dedicatedSlug ?? "n/a"} and ${scope.courseCode}`);
  }

  const targetLevelOrder = getScopeLevelOrder(scope, abekaGradeOrderMap);
  if (targetLevelOrder == null) {
    throw new Error(`Cannot resolve level order for ${scope.scopeId}`);
  }

  const byLevelOrder = monolith.lessons.filter((item) => item.lesson?.unit?.level?.orderNo === targetLevelOrder);
  let selected = byLevelOrder;
  let strategy = "monolith_level_order_filter";

  if (selected.length !== expectedTotalCount) {
    const byLevelTitle = monolith.lessons.filter((item) => isLevelTitleMatch(scope, item.lesson?.unit?.level?.title ?? ""));
    if (byLevelTitle.length === expectedTotalCount) {
      selected = byLevelTitle;
      strategy = "monolith_level_title_filter";
    }
  }

  if (selected.length !== expectedTotalCount) {
    throw new Error(
      `Monolith source mismatch for ${scope.scopeId}. selected=${selected.length}, expected=${expectedTotalCount}, targetLevelOrder=${targetLevelOrder}`,
    );
  }

  return {
    sourceCourse: monolith,
    sourceSlug: monolith.slug,
    strategy,
    lessonIds: selected.map((item) => item.lessonId),
  };
}

export function pickLessonIdsByRange(orderedLessonIds, row) {
  const fromIndex = row.from - 1;
  const toIndex = row.to;
  const picked = orderedLessonIds.slice(fromIndex, toIndex);
  const expectedCount = row.to - row.from + 1;
  if (picked.length !== expectedCount) {
    throw new Error(
      `Range selection mismatch for ${row.sku}. from=${row.from}, to=${row.to}, picked=${picked.length}, expected=${expectedCount}`,
    );
  }
  return picked;
}

export function compareOrderedLessonIds(expectedIds, actualIds) {
  const expectedSet = new Set(expectedIds);
  const actualSet = new Set(actualIds);

  const missingLessonIds = expectedIds.filter((id) => !actualSet.has(id));
  const extraLessonIds = actualIds.filter((id) => !expectedSet.has(id));

  let firstOrderMismatchIndex = null;
  const minLength = Math.min(expectedIds.length, actualIds.length);
  for (let i = 0; i < minLength; i += 1) {
    if (expectedIds[i] !== actualIds[i]) {
      firstOrderMismatchIndex = i + 1;
      break;
    }
  }

  const sameLength = expectedIds.length === actualIds.length;
  const exactMatch =
    sameLength &&
    missingLessonIds.length === 0 &&
    extraLessonIds.length === 0 &&
    (firstOrderMismatchIndex == null || expectedIds.join("|") === actualIds.join("|"));

  return {
    exactMatch,
    expectedCount: expectedIds.length,
    actualCount: actualIds.length,
    missingLessonIds,
    extraLessonIds,
    firstOrderMismatchIndex,
  };
}
