import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "docs", "api", "program-bootstrap", "three-courses-program.json");
const out = path.join(root, "plans", "2026-03-17-education-agent-team", "reports", "course-baseline-metrics.json");

const raw = JSON.parse(fs.readFileSync(src, "utf8"));
const byCode = new Map(raw.courses.map((c) => [c.courseCode, c]));

const abeka = byCode.get("abeka");
const littlefox = byCode.get("littlefox");
const littlefoxcn = byCode.get("littlefoxcn");

function pickLevel(course, levels) {
  return course.levels.filter((l) => levels.includes(l.level));
}

const pilot = {
  abeka: abeka.grades
    .filter((g) => ["k4", "k5", "g1"].includes(g.gradeCode))
    .map((g) => ({
      gradeCode: g.gradeCode,
      lessonCount: g.lessonCount,
      videoCount: g.videoCount,
      estimatedWeeks: g.estimatedWeeks,
      phaseCounts: g.phases.map((p) => ({ name: p.name, count: p.count })),
    })),
  littlefox: pickLevel(littlefox, [1, 2]).map((l) => ({
    level: l.level,
    seriesCount: l.seriesCount,
    episodeCount: l.episodeCount,
    recommendedEpisodesPerWeek: l.recommendedEpisodesPerWeek,
    phaseCounts: l.phases.map((p) => ({ name: p.name, count: p.count })),
  })),
  littlefoxcn: pickLevel(littlefoxcn, [1]).map((l) => ({
    level: l.level,
    seriesCount: l.seriesCount,
    episodeCount: l.episodeCount,
    recommendedEpisodesPerWeek: l.recommendedEpisodesPerWeek,
    phaseCounts: l.phases.map((p) => ({ name: p.name, count: p.count })),
  })),
};

const totals = {
  abekaLessons: abeka.totals.lessons,
  abekaVideos: abeka.totals.videos,
  littlefoxEpisodes: littlefox.totals.episodes,
  littlefoxcnEpisodes: littlefoxcn.totals.episodes,
};

const pilotTotals = {
  abekaLessons: pilot.abeka.reduce((s, x) => s + x.lessonCount, 0),
  abekaVideos: pilot.abeka.reduce((s, x) => s + x.videoCount, 0),
  littlefoxEpisodes: pilot.littlefox.reduce((s, x) => s + x.episodeCount, 0),
  littlefoxcnEpisodes: pilot.littlefoxcn.reduce((s, x) => s + x.episodeCount, 0),
};

const pilotCoveragePct = {
  abekaLessons: Number(((pilotTotals.abekaLessons / totals.abekaLessons) * 100).toFixed(2)),
  abekaVideos: Number(((pilotTotals.abekaVideos / totals.abekaVideos) * 100).toFixed(2)),
  littlefoxEpisodes: Number(((pilotTotals.littlefoxEpisodes / totals.littlefoxEpisodes) * 100).toFixed(2)),
  littlefoxcnEpisodes: Number(((pilotTotals.littlefoxcnEpisodes / totals.littlefoxcnEpisodes) * 100).toFixed(2)),
};

const output = {
  generatedAt: new Date().toISOString(),
  source: "docs/api/program-bootstrap/three-courses-program.json",
  totals,
  pilot,
  pilotTotals,
  pilotCoveragePct,
  assumptions: {
    pilotSkuCount: 12,
    abekaPilotSkuPerGrade: 2,
    littlefoxPilotSkuPerLevel: 2,
    littlefoxCnPilotSkuPerLevel: 2,
  },
};

fs.writeFileSync(out, JSON.stringify(output, null, 2));
console.log(`Wrote ${out}`);
