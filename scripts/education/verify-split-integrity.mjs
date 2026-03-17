import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const planDir = path.join(root, "plans", "2026-03-17-education-agent-team");
const reportsDir = path.join(planDir, "reports");
const srcPath = path.join(root, "docs", "api", "program-bootstrap", "three-courses-program.json");

const fullOutPath = path.join(reportsDir, "split-integrity-full.json");
const pilotOutPath = path.join(reportsDir, "split-integrity-pilot.json");
const summaryOutPath = path.join(reportsDir, "split-integrity-summary.md");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @param {number} totalCount
 * @param {{id:string,from:number,to:number,expectedCount?:number}[]} segments
 * @param {{requireFullCoverage:boolean}} options
 */
function validateRanges(totalCount, segments, options) {
  const seen = new Set();
  const overlapHits = [];
  const outOfRangeHits = [];
  const invalidRanges = [];
  const expectedCountMismatches = [];

  for (const seg of segments) {
    if (!Number.isInteger(seg.from) || !Number.isInteger(seg.to) || seg.from > seg.to) {
      invalidRanges.push(seg.id);
      continue;
    }

    const actualSegCount = seg.to - seg.from + 1;
    if (typeof seg.expectedCount === "number" && seg.expectedCount !== actualSegCount) {
      expectedCountMismatches.push({ id: seg.id, expectedCount: seg.expectedCount, actualCount: actualSegCount });
    }

    for (let i = seg.from; i <= seg.to; i += 1) {
      if (i < 1 || i > totalCount) {
        outOfRangeHits.push(`${seg.id}:${i}`);
        continue;
      }
      if (seen.has(i)) {
        overlapHits.push(`${seg.id}:${i}`);
      } else {
        seen.add(i);
      }
    }
  }

  const mappedCount = seen.size;
  const totalCoveragePct = totalCount === 0 ? 0 : Number(((mappedCount / totalCount) * 100).toFixed(2));
  const gapCount = Math.max(0, totalCount - mappedCount);

  const ok =
    invalidRanges.length === 0 &&
    expectedCountMismatches.length === 0 &&
    outOfRangeHits.length === 0 &&
    overlapHits.length === 0 &&
    (!options.requireFullCoverage || gapCount === 0);

  return {
    ok,
    requireFullCoverage: options.requireFullCoverage,
    totalCount,
    segmentCount: segments.length,
    mappedCount,
    gapCount,
    coveragePct: totalCoveragePct,
    invalidRanges,
    expectedCountMismatches,
    outOfRangeHitCount: outOfRangeHits.length,
    overlapHitCount: overlapHits.length,
    sampleOutOfRange: outOfRangeHits.slice(0, 10),
    sampleOverlap: overlapHits.slice(0, 10),
  };
}

function createScopeId(courseCode, unitLabel, unitValue) {
  return `${courseCode}:${unitLabel}:${unitValue}`;
}

function createFullChecks(raw) {
  const byCode = new Map(raw.courses.map((c) => [c.courseCode, c]));
  const checks = [];

  const abeka = byCode.get("abeka");
  for (const grade of abeka.grades) {
    const scopeId = createScopeId("abeka", "grade", grade.gradeCode);
    const segments = grade.phases.map((p) => ({
      id: `${scopeId}:phase:${p.name}`,
      from: p.from,
      to: p.to,
      expectedCount: p.count,
    }));
    checks.push({
      scopeId,
      courseCode: "abeka",
      unitType: "grade",
      unitValue: grade.gradeCode,
      totalCount: grade.lessonCount,
      validation: validateRanges(grade.lessonCount, segments, { requireFullCoverage: true }),
    });
  }

  const littlefox = byCode.get("littlefox");
  for (const level of littlefox.levels) {
    const scopeId = createScopeId("littlefox", "level", level.level);
    const segments = level.phases.map((p) => ({
      id: `${scopeId}:phase:${p.name}`,
      from: p.from,
      to: p.to,
      expectedCount: p.count,
    }));
    checks.push({
      scopeId,
      courseCode: "littlefox",
      unitType: "level",
      unitValue: level.level,
      totalCount: level.episodeCount,
      validation: validateRanges(level.episodeCount, segments, { requireFullCoverage: true }),
    });
  }

  const littlefoxcn = byCode.get("littlefoxcn");
  for (const level of littlefoxcn.levels) {
    const scopeId = createScopeId("littlefoxcn", "level", level.level);
    const segments = level.phases.map((p) => ({
      id: `${scopeId}:phase:${p.name}`,
      from: p.from,
      to: p.to,
      expectedCount: p.count,
    }));
    checks.push({
      scopeId,
      courseCode: "littlefoxcn",
      unitType: "level",
      unitValue: level.level,
      totalCount: level.episodeCount,
      validation: validateRanges(level.episodeCount, segments, { requireFullCoverage: true }),
    });
  }

  return checks;
}

function buildSequentialPilotSegments(scopeId, totalCount, pacePerWeek, templates) {
  const segments = [];
  let cursor = 1;

  for (const tpl of templates) {
    if (cursor > totalCount) {
      break;
    }

    const plannedCount = tpl.weeks * pacePerWeek;
    const from = cursor;
    const to = Math.min(totalCount, cursor + plannedCount - 1);
    const actualCount = to - from + 1;
    segments.push({
      id: `${scopeId}:sku:${tpl.sku}`,
      from,
      to,
      expectedCount: actualCount,
      sku: tpl.sku,
      weeks: tpl.weeks,
      plannedCount,
      actualCount,
      clipped: actualCount < plannedCount,
    });
    cursor = to + 1;
  }

  return segments;
}

function createPilotChecks(raw) {
  const byCode = new Map(raw.courses.map((c) => [c.courseCode, c]));
  const checks = [];

  const abeka = byCode.get("abeka");
  const abekaGrades = ["k4", "k5", "g1"];
  for (const gradeCode of abekaGrades) {
    const grade = abeka.grades.find((g) => g.gradeCode === gradeCode);
    assert(grade, `Missing abeka grade ${gradeCode}`);
    const scopeId = createScopeId("abeka", "grade", grade.gradeCode);
    const segments = buildSequentialPilotSegments(scopeId, grade.lessonCount, grade.recommendedLessonsPerWeek, [
      { sku: `ABEKA-${gradeCode.toUpperCase()}-INTRO-4W`, weeks: 4 },
      { sku: `ABEKA-${gradeCode.toUpperCase()}-FOUNDATION-8W`, weeks: 8 },
    ]);

    const validation = validateRanges(grade.lessonCount, segments, { requireFullCoverage: false });

    checks.push({
      scopeId,
      courseCode: "abeka",
      unitType: "grade",
      unitValue: grade.gradeCode,
      totalCount: grade.lessonCount,
      pacePerWeek: grade.recommendedLessonsPerWeek,
      segments,
      validation,
    });
  }

  const littlefox = byCode.get("littlefox");
  const littlefoxLevels = [1, 2];
  for (const levelNo of littlefoxLevels) {
    const level = littlefox.levels.find((l) => l.level === levelNo);
    assert(level, `Missing littlefox level ${levelNo}`);
    const scopeId = createScopeId("littlefox", "level", level.level);
    const segments = buildSequentialPilotSegments(scopeId, level.episodeCount, level.recommendedEpisodesPerWeek, [
      { sku: `LFEN-L${level.level}-STARTER-6W`, weeks: 6 },
      { sku: `LFEN-L${level.level}-BUILDER-8W`, weeks: 8 },
    ]);

    const validation = validateRanges(level.episodeCount, segments, { requireFullCoverage: false });

    checks.push({
      scopeId,
      courseCode: "littlefox",
      unitType: "level",
      unitValue: level.level,
      totalCount: level.episodeCount,
      pacePerWeek: level.recommendedEpisodesPerWeek,
      segments,
      validation,
    });
  }

  const littlefoxcn = byCode.get("littlefoxcn");
  const cnLevel = littlefoxcn.levels.find((l) => l.level === 1);
  assert(cnLevel, "Missing littlefoxcn level 1");
  {
    const scopeId = createScopeId("littlefoxcn", "level", cnLevel.level);
    const segments = buildSequentialPilotSegments(scopeId, cnLevel.episodeCount, cnLevel.recommendedEpisodesPerWeek, [
      { sku: `LFCN-L${cnLevel.level}-STARTER-5W`, weeks: 5 },
      { sku: `LFCN-L${cnLevel.level}-BUILDER-8W`, weeks: 8 },
    ]);

    const validation = validateRanges(cnLevel.episodeCount, segments, { requireFullCoverage: false });

    checks.push({
      scopeId,
      courseCode: "littlefoxcn",
      unitType: "level",
      unitValue: cnLevel.level,
      totalCount: cnLevel.episodeCount,
      pacePerWeek: cnLevel.recommendedEpisodesPerWeek,
      segments,
      validation,
    });
  }

  return checks;
}

function summarize(checks) {
  const fail = checks.filter((c) => !c.validation.ok);
  const totalCount = checks.length;
  const passCount = totalCount - fail.length;

  return {
    totalScopes: totalCount,
    passScopes: passCount,
    failScopes: fail.length,
    allPassed: fail.length === 0,
    failedScopeIds: fail.map((f) => f.scopeId),
  };
}

function buildSummaryMarkdown(full, pilot) {
  const lines = [];
  lines.push("# Split Integrity Summary");
  lines.push("");
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Full decomposition integrity");
  lines.push(`- Total scopes: ${full.summary.totalScopes}`);
  lines.push(`- Pass scopes: ${full.summary.passScopes}`);
  lines.push(`- Fail scopes: ${full.summary.failScopes}`);
  lines.push(`- Status: ${full.summary.allPassed ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## Pilot decomposition integrity");
  lines.push(`- Total scopes: ${pilot.summary.totalScopes}`);
  lines.push(`- Pass scopes: ${pilot.summary.passScopes}`);
  lines.push(`- Fail scopes: ${pilot.summary.failScopes}`);
  lines.push(`- Status: ${pilot.summary.allPassed ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## Notes");
  lines.push("- Full decomposition requires 100% coverage (no gap, no overlap, no out-of-range).");
  lines.push("- Pilot decomposition allows partial coverage but disallows overlap/out-of-range/invalid ranges.");
  lines.push("");
  lines.push("## Failed scopes (if any)");
  lines.push(`- Full: ${full.summary.failedScopeIds.length ? full.summary.failedScopeIds.join(", ") : "none"}`);
  lines.push(`- Pilot: ${pilot.summary.failedScopeIds.length ? pilot.summary.failedScopeIds.join(", ") : "none"}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(srcPath, "utf8"));

  const fullChecks = createFullChecks(raw);
  const pilotChecks = createPilotChecks(raw);

  const full = {
    generatedAt: new Date().toISOString(),
    source: path.relative(root, srcPath).replaceAll("\\", "/"),
    mode: "full",
    summary: summarize(fullChecks),
    checks: fullChecks,
  };

  const pilot = {
    generatedAt: new Date().toISOString(),
    source: path.relative(root, srcPath).replaceAll("\\", "/"),
    mode: "pilot",
    summary: summarize(pilotChecks),
    checks: pilotChecks,
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(fullOutPath, JSON.stringify(full, null, 2));
  fs.writeFileSync(pilotOutPath, JSON.stringify(pilot, null, 2));
  fs.writeFileSync(summaryOutPath, buildSummaryMarkdown(full, pilot));

  console.log(`Wrote ${fullOutPath}`);
  console.log(`Wrote ${pilotOutPath}`);
  console.log(`Wrote ${summaryOutPath}`);

  if (!full.summary.allPassed || !pilot.summary.allPassed) {
    process.exitCode = 1;
  }
}

main();
