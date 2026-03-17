import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportsDir = path.join(root, "plans", "2026-03-17-education-agent-team", "reports");
const integrityPath = path.join(reportsDir, "split-integrity-pilot.json");
const outPath = path.join(reportsDir, "pilot-sku-manifest.json");

const integrity = JSON.parse(fs.readFileSync(integrityPath, "utf8"));

const manifest = {
  generatedAt: new Date().toISOString(),
  source: "split-integrity-pilot.json",
  summary: integrity.summary,
  skus: integrity.checks.flatMap((scope) =>
    (scope.segments || []).map((seg, index) => ({
      sku: seg.sku || seg.id,
      orderNo: index + 1,
      courseCode: scope.courseCode,
      unitType: scope.unitType,
      unitValue: scope.unitValue,
      scopeId: scope.scopeId,
      from: seg.from,
      to: seg.to,
      lessonOrEpisodeCount: seg.actualCount,
      pacePerWeek: scope.pacePerWeek,
      weeks: seg.weeks,
      plannedCount: seg.plannedCount,
      clipped: Boolean(seg.clipped),
    })),
  ),
};

fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${outPath}`);
