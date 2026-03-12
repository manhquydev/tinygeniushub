import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const apiRoot = path.resolve(process.argv[2] ?? path.join(cwd, "docs", "api"));
const outDir = path.resolve(process.argv[3] ?? path.join(cwd, "docs", "api", "program-bootstrap"));
const outJsonPath = path.join(outDir, "three-courses-program.json");
const outSummaryPath = path.join(outDir, "three-courses-program-summary.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function round2(value) {
  return Number(value.toFixed(2));
}

function computeRangePhases(totalItems) {
  if (totalItems <= 0) return [];

  const p1End = Math.max(1, Math.round(totalItems * 0.3));
  const p2End = Math.max(p1End + 1, Math.round(totalItems * 0.8));
  const p3End = totalItems;

  return [
    { phase: 1, name: "foundation", from: 1, to: p1End, count: p1End },
    { phase: 2, name: "core", from: p1End + 1, to: p2End, count: p2End - p1End },
    { phase: 3, name: "mastery", from: p2End + 1, to: p3End, count: p3End - p2End },
  ];
}

function chunkByCount(totalCount, chunkSize, keyStart, keyEnd, keyCount) {
  const chunks = [];
  if (totalCount <= 0) return chunks;
  let blockNo = 1;
  for (let start = 1; start <= totalCount; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, totalCount);
    chunks.push({
      blockNo,
      [keyStart]: start,
      [keyEnd]: end,
      [keyCount]: end - start + 1,
    });
    blockNo += 1;
  }
  return chunks;
}

function normalizeAbekaProviders(providers) {
  const order = ["k4", "k5", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10", "g11", "g12"];
  const rank = new Map(order.map((provider, index) => [provider, index]));
  return [...providers].sort((a, b) => {
    const ra = rank.has(a.provider) ? rank.get(a.provider) : 10_000;
    const rb = rank.has(b.provider) ? rank.get(b.provider) : 10_000;
    if (ra !== rb) return ra - rb;
    return String(a.provider).localeCompare(String(b.provider));
  });
}

function buildAbekaProgram() {
  const root = path.join(apiRoot, "abeka");
  const index = readJson(path.join(root, "index.json"));
  const providers = normalizeAbekaProviders(index.providers ?? []);

  const grades = providers.map((provider) => {
    const providerIndexPath = path.join(root, provider.path);
    const providerIndex = readJson(providerIndexPath);
    const lessons = [...(providerIndex.courses ?? [])].sort((a, b) => Number(a.lesson) - Number(b.lesson));
    const lessonCount = lessons.length;
    const videoCounts = lessons.map((lesson) => Number(lesson.video_count) || 0);
    const videosTotal = sum(videoCounts);
    const recommendedLessonsPerWeek = provider.provider.startsWith("k") ? 4 : 5;
    const estimatedWeeks = Math.ceil(lessonCount / recommendedLessonsPerWeek);

    const weeklyBlocks = [];
    let weekNo = 1;
    for (let i = 0; i < lessons.length; i += recommendedLessonsPerWeek) {
      const window = lessons.slice(i, i + recommendedLessonsPerWeek);
      weeklyBlocks.push({
        weekNo,
        lessonFrom: Number(window[0].lesson),
        lessonTo: Number(window[window.length - 1].lesson),
        lessonCount: window.length,
        videoCount: sum(window.map((item) => Number(item.video_count) || 0)),
      });
      weekNo += 1;
    }

    return {
      gradeCode: provider.provider,
      gradeId: provider.grade_id,
      lessonCount,
      videoCount: videosTotal,
      videoPerLessonAvg: round2(average(videoCounts)),
      recommendedLessonsPerWeek,
      estimatedWeeks,
      phases: computeRangePhases(lessonCount),
      weeklyBlocks,
    };
  });

  const totalLessons = sum(grades.map((grade) => grade.lessonCount));
  const totalVideos = sum(grades.map((grade) => grade.videoCount));

  return {
    courseCode: "abeka",
    courseTitle: "Abeka",
    model: "grade_lesson",
    totals: {
      grades: grades.length,
      lessons: totalLessons,
      videos: totalVideos,
    },
    defaultLessonDurationMinutes: 15,
    grades,
  };
}

function buildLittleFoxProgram(courseCode) {
  const root = path.join(apiRoot, courseCode);
  const index = readJson(path.join(root, "index.json"));

  const levelMap = new Map();
  const mismatches = [];

  for (const series of index) {
    const level = Number(series.level) || 0;
    const levelKey = String(level);
    if (!levelMap.has(levelKey)) levelMap.set(levelKey, []);

    const seriesPath = path.join(root, `${series.lfid}.json`);
    const episodes = fs.existsSync(seriesPath) ? readJson(seriesPath) : [];
    const declaredEpisodeCount = Number(series.episode_count) || 0;
    const actualEpisodeCount = Array.isArray(episodes) ? episodes.length : 0;
    const recommendedEpisodesPerWeek = level <= 2 ? 5 : level <= 5 ? 4 : 3;

    if (declaredEpisodeCount !== actualEpisodeCount) {
      mismatches.push({
        lfid: series.lfid,
        declaredEpisodeCount,
        actualEpisodeCount,
      });
    }

    levelMap.get(levelKey).push({
      lfid: series.lfid,
      title: series.title,
      status: series.status,
      episodeCount: actualEpisodeCount,
      recommendedEpisodesPerWeek,
      estimatedWeeks: Math.ceil(actualEpisodeCount / recommendedEpisodesPerWeek),
      episodeBlocks: chunkByCount(actualEpisodeCount, recommendedEpisodesPerWeek, "episodeFrom", "episodeTo", "episodeCount"),
    });
  }

  const levels = [...levelMap.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([level, seriesList]) => {
      const episodes = sum(seriesList.map((item) => item.episodeCount));
      return {
        level: Number(level),
        seriesCount: seriesList.length,
        episodeCount: episodes,
        recommendedEpisodesPerWeek: Number(level) <= 2 ? 5 : Number(level) <= 5 ? 4 : 3,
        phases: computeRangePhases(episodes),
        series: seriesList.sort((a, b) => {
          if (a.episodeCount !== b.episodeCount) return b.episodeCount - a.episodeCount;
          return a.lfid.localeCompare(b.lfid);
        }),
      };
    });

  const totals = {
    levels: levels.length,
    series: sum(levels.map((item) => item.seriesCount)),
    episodes: sum(levels.map((item) => item.episodeCount)),
  };

  return {
    courseCode,
    courseTitle: courseCode === "littlefox" ? "Little Fox EN" : "Little Fox CN",
    model: "level_series_episode",
    totals,
    defaultEpisodeDurationMinutes: 10,
    levelMismatchCount: mismatches.length,
    mismatches,
    levels,
  };
}

function buildSummaryMarkdown(program) {
  const lines = [];
  lines.push("# Three-course program bootstrap summary");
  lines.push("");
  lines.push(`Generated at (UTC): ${program.generatedAtUtc}`);
  lines.push("");
  lines.push("| Course | Levels/Grades | Collections | Lessons/Episodes | Videos |");
  lines.push("|---|---:|---:|---:|---:|");

  for (const course of program.courses) {
    if (course.courseCode === "abeka") {
      lines.push(`| ${course.courseCode} | ${course.totals.grades} | ${course.totals.grades} | ${course.totals.lessons} | ${course.totals.videos} |`);
    } else {
      lines.push(`| ${course.courseCode} | ${course.totals.levels} | ${course.totals.series} | ${course.totals.episodes} | n/a |`);
    }
  }

  lines.push("");
  lines.push("## Rollout proposal");
  lines.push("");
  lines.push("1. Phase 1 (pilot):");
  lines.push("   - abeka: k4, k5, g1");
  lines.push("   - littlefox: level 1-2");
  lines.push("   - littlefoxcn: level 1-2");
  lines.push("2. Phase 2 (scale):");
  lines.push("   - abeka: g2-g6");
  lines.push("   - littlefox: level 3-6");
  lines.push("   - littlefoxcn: level 3-4");
  lines.push("3. Phase 3 (full):");
  lines.push("   - abeka: g7-g12");
  lines.push("   - littlefox: level 7-9");
  lines.push("   - littlefoxcn: level 5");

  return `${lines.join("\n")}\n`;
}

function main() {
  const program = {
    generatedAtUtc: new Date().toISOString(),
    sourceRoot: path.relative(cwd, apiRoot).replaceAll("\\", "/"),
    assumptions: {
      abekaLessonsPerWeek: {
        kindergarten: 4,
        grade1To12: 5,
      },
      littlefoxEpisodesPerWeekByLevel: {
        level1To2: 5,
        level3To5: 4,
        level6Plus: 3,
      },
      lessonDurationMinutes: {
        abeka: 15,
        littlefox: 10,
        littlefoxcn: 10,
      },
    },
    courses: [buildAbekaProgram(), buildLittleFoxProgram("littlefox"), buildLittleFoxProgram("littlefoxcn")],
  };

  ensureDir(outDir);
  fs.writeFileSync(outJsonPath, JSON.stringify(program, null, 2));
  fs.writeFileSync(outSummaryPath, buildSummaryMarkdown(program));

  console.log(`Wrote ${outJsonPath}`);
  console.log(`Wrote ${outSummaryPath}`);
}

main();
