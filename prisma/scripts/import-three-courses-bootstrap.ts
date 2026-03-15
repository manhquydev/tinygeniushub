/**
 * Import external programs (abeka, littlefox, littlefoxcn) from bootstrap JSON
 * into Prisma models: Course, Lesson, CourseLesson.
 *
 * Security:
 * - External video URLs are encrypted before storing in lesson.videoSource.
 * - No raw upstream URL is persisted in markdown fields.
 *
 * Run:
 *   npx tsx prisma/scripts/import-three-courses-bootstrap.ts
 *   npx tsx prisma/scripts/import-three-courses-bootstrap.ts --dry-run
 *   npx tsx prisma/scripts/import-three-courses-bootstrap.ts --publish
 */

import { createCipheriv, createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, TrackCode } from "@prisma/client";

const prisma = new PrismaClient();

const ENCRYPTED_VIDEO_SOURCE_PREFIX = "encv1";
const DEFAULT_ALLOWED_VIDEO_HOSTS = ["fileta.hoctienganh.xyz", "cdn.littlefox.com"];
const DEFAULT_SESSION_SECRET = "dev-session-secret-change-this-in-production-32";

type BootstrapGrade = {
  gradeCode: string;
  lessonCount: number;
};

type BootstrapSeries = {
  lfid: string;
  title: string;
  episodeCount: number;
};

type BootstrapLevel = {
  level: number;
  series: BootstrapSeries[];
};

type BootstrapCourse =
  | {
      courseCode: "abeka";
      courseTitle: string;
      grades: BootstrapGrade[];
      totals: { lessons: number; videos: number };
    }
  | {
      courseCode: "littlefox" | "littlefoxcn";
      courseTitle: string;
      levels: BootstrapLevel[];
      totals: { episodes: number; series: number };
    };

type BootstrapRoot = {
  courses: BootstrapCourse[];
};

type LessonImportRow = {
  courseCode: "abeka" | "littlefox" | "littlefoxcn";
  courseOrderNo: number;
  levelOrderNo: number;
  levelTitle: string;
  unitOrderNo: number;
  unitTitle: string;
  lessonOrderNo: number;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  trialEnabled: boolean;
  videoSourceEncrypted: string | null;
  sourceKey: string;
};

type ImportSummary = {
  lessonsPrepared: number;
  lessonsCreated: number;
  lessonsUpdated: number;
  courseLessonsCreated: number;
  courseLessonsUpdated: number;
  blockedVideoHostCount: number;
  blockedVideoHostSamples: string[];
  missingSourceCount: number;
  missingSourceSamples: string[];
};

function pushSample(target: string[], value: string, max = 20) {
  if (target.length >= max) return;
  target.push(value);
}

function getArg(flag: string) {
  const argv = process.argv;
  const index = argv.findIndex((item) => item === flag || item.startsWith(`${flag}=`));
  if (index === -1) return null;
  if (argv[index].includes("=")) {
    return argv[index].split("=", 2)[1] ?? null;
  }
  return argv[index + 1] ?? null;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function pad3(value: number) {
  return String(value).padStart(3, "0");
}

function sanitizeSlugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveVideoKey(secret: string) {
  return createHash("sha256").update(`video-source:${secret}`).digest();
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET;
}

function encryptVideoSource(rawUrl: string, secret: string) {
  const key = deriveVideoKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(rawUrl, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTED_VIDEO_SOURCE_PREFIX}:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

function getAllowedVideoHosts() {
  const override = process.env.VIDEO_SOURCE_ALLOWED_HOSTS;
  if (!override || override.trim().length === 0) {
    return new Set(DEFAULT_ALLOWED_VIDEO_HOSTS);
  }

  const hosts = override
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host.length > 0);
  return new Set(hosts.length > 0 ? hosts : DEFAULT_ALLOWED_VIDEO_HOSTS);
}

function isAllowedVideoUrl(value: string) {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }
    return getAllowedVideoHosts().has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function toObjective(courseCode: string, title: string) {
  if (courseCode === "abeka") {
    return `Complete ${title} in the Abeka pathway with consistent daily progress.`;
  }
  if (courseCode === "littlefox") {
    return `Listen to and understand "${title}" in Little Fox EN.`;
  }
  return `Listen to and understand "${title}" in Little Fox CN.`;
}

function getBootstrapCourse(root: BootstrapRoot, code: BootstrapCourse["courseCode"]) {
  const found = root.courses.find((course) => course.courseCode === code);
  if (!found) {
    throw new Error(`Missing bootstrap course: ${code}`);
  }
  return found;
}

function sortByEpisodeSequence<T extends { episode_index?: number; episode_no?: number }>(episodes: T[]) {
  return [...episodes].sort((a, b) => {
    const ai = Number.isFinite(Number(a.episode_index)) ? Number(a.episode_index) : Number(a.episode_no) || 0;
    const bi = Number.isFinite(Number(b.episode_index)) ? Number(b.episode_index) : Number(b.episode_no) || 0;
    return ai - bi;
  });
}

function parseDurationSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function toEstimatedMinutesFromSeconds(seconds: number | null, fallbackMinutes: number) {
  if (!seconds || seconds <= 0) return fallbackMinutes;
  return Math.max(1, Math.ceil(seconds / 60));
}

function buildAbekaRows(input: {
  apiRoot: string;
  bootstrap: Extract<BootstrapCourse, { courseCode: "abeka" }>;
  sessionSecret: string;
  summary: ImportSummary;
}) {
  const rows: LessonImportRow[] = [];
  let courseOrderNo = 1;

  const gradeOrder = input.bootstrap.grades.map((grade) => grade.gradeCode);
  for (let gradeIndex = 0; gradeIndex < gradeOrder.length; gradeIndex += 1) {
    const gradeCode = gradeOrder[gradeIndex];
    const grade = input.bootstrap.grades.find((item) => item.gradeCode === gradeCode);
    if (!grade) continue;

    const levelOrderNo = 1000 + gradeIndex + 1;
    const levelTitle = `Abeka ${gradeCode.toUpperCase()}`;
    const unitOrderNo = 1;
    const unitTitle = "Core lessons";

    for (let lessonNo = 1; lessonNo <= grade.lessonCount; lessonNo += 1) {
      const lessonKey = pad3(lessonNo);
      const lessonPath = path.join(
        input.apiRoot,
        "abeka",
        "providers",
        gradeCode,
        "lessons",
        `${lessonKey}.json`,
      );
      if (!fs.existsSync(lessonPath)) {
        input.summary.missingSourceCount += 1;
        pushSample(input.summary.missingSourceSamples, `abeka:${gradeCode}:${lessonKey}`);
        continue;
      }

      const payload = readJson<{
        videos?: Array<{
          title?: string;
          video_url?: string;
        }>;
      }>(lessonPath);
      const videos = payload.videos ?? [];
      const title = `Abeka ${gradeCode.toUpperCase()} Lesson ${lessonKey}`;
      const videoUrl = videos.find((video) => typeof video.video_url === "string" && video.video_url.length > 0)?.video_url;

      let videoSourceEncrypted: string | null = null;
      if (videoUrl) {
        if (isAllowedVideoUrl(videoUrl)) {
          videoSourceEncrypted = encryptVideoSource(videoUrl, input.sessionSecret);
        } else {
          input.summary.blockedVideoHostCount += 1;
          pushSample(input.summary.blockedVideoHostSamples, `abeka:${gradeCode}:${lessonKey}:${videoUrl}`);
        }
      }

      rows.push({
        courseCode: "abeka",
        courseOrderNo,
        levelOrderNo,
        levelTitle,
        unitOrderNo,
        unitTitle,
        lessonOrderNo: lessonNo,
        slug: `abeka-${sanitizeSlugPart(gradeCode)}-lesson-${lessonKey}`,
        title,
        objective: toObjective("abeka", title),
        estimatedMinutes: 15,
        trialEnabled: ["k4", "k5", "g1"].includes(gradeCode) && lessonNo <= 5,
        videoSourceEncrypted,
        sourceKey: `abeka:${gradeCode}:${lessonKey}`,
      });

      courseOrderNo += 1;
    }
  }

  return rows;
}

function buildLittleFoxRows(input: {
  apiRoot: string;
  courseCode: "littlefox" | "littlefoxcn";
  bootstrap: Extract<BootstrapCourse, { courseCode: "littlefox" | "littlefoxcn" }>;
  sessionSecret: string;
  summary: ImportSummary;
}) {
  const rows: LessonImportRow[] = [];
  let courseOrderNo = 1;
  const levelBase = input.courseCode === "littlefox" ? 2000 : 3000;
  const estimatedMinutes = 10;
  const sourceIndex = readJson<Array<{ lfid: string }>>(path.join(input.apiRoot, input.courseCode, "index.json"));
  const sourceOrderMap = new Map(sourceIndex.map((item, index) => [item.lfid, index]));

  for (const level of input.bootstrap.levels) {
    const levelOrderNo = levelBase + Number(level.level);
    const levelTitle =
      input.courseCode === "littlefox"
        ? `Little Fox EN Level ${level.level}`
        : `Little Fox CN Level ${level.level}`;

    const seriesInLevel = [...level.series].sort((a, b) => {
      const ai = sourceOrderMap.get(a.lfid) ?? Number.MAX_SAFE_INTEGER;
      const bi = sourceOrderMap.get(b.lfid) ?? Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
      return a.lfid.localeCompare(b.lfid);
    });

    for (let seriesIndex = 0; seriesIndex < seriesInLevel.length; seriesIndex += 1) {
      const series = seriesInLevel[seriesIndex];
      const unitOrderNo = seriesIndex + 1;
      const unitTitle = `${series.title} (${series.lfid})`;
      const seriesPath = path.join(input.apiRoot, input.courseCode, `${series.lfid}.json`);
      if (!fs.existsSync(seriesPath)) {
        if ((series.episodeCount ?? 0) > 0) {
          input.summary.missingSourceCount += 1;
          pushSample(input.summary.missingSourceSamples, `${input.courseCode}:${series.lfid}`);
        }
        continue;
      }

      const episodes = sortByEpisodeSequence(
        readJson<
          Array<{
            episode_index?: number;
            episode_no?: number;
            episode_title?: string;
            cont_title?: string;
            play_time_sec?: string | number;
            hls_url?: string;
            video_url?: string;
            raw?: {
              play_time?: string | number;
            };
          }>
        >(seriesPath),
      );

      for (let episodeIndex = 0; episodeIndex < episodes.length; episodeIndex += 1) {
        const episode = episodes[episodeIndex];
        const episodeOrderNo = episodeIndex + 1;
        const episodeCode = pad3(episodeOrderNo);
        const title =
          (episode.episode_title && episode.episode_title.trim().length > 0
            ? episode.episode_title.trim()
            : `${series.title} Episode ${episodeOrderNo}`);
        const objectiveTitle =
          (episode.cont_title && episode.cont_title.trim().length > 0
            ? episode.cont_title.trim()
            : title);
        const playTimeSeconds =
          parseDurationSeconds(episode.play_time_sec) ??
          parseDurationSeconds(episode.raw?.play_time);
        const episodeEstimatedMinutes = toEstimatedMinutesFromSeconds(playTimeSeconds, estimatedMinutes);
        const rawVideoUrl =
          (episode.hls_url && episode.hls_url.trim().length > 0
            ? episode.hls_url.trim()
            : episode.video_url?.trim()) || null;

        let videoSourceEncrypted: string | null = null;
        if (rawVideoUrl) {
          if (isAllowedVideoUrl(rawVideoUrl)) {
            videoSourceEncrypted = encryptVideoSource(rawVideoUrl, input.sessionSecret);
          } else {
            input.summary.blockedVideoHostCount += 1;
            pushSample(
              input.summary.blockedVideoHostSamples,
              `${input.courseCode}:${series.lfid}:${episodeCode}:${rawVideoUrl}`,
            );
          }
        }

        rows.push({
          courseCode: input.courseCode,
          courseOrderNo,
          levelOrderNo,
          levelTitle,
          unitOrderNo,
          unitTitle,
          lessonOrderNo: episodeOrderNo,
          slug: `${input.courseCode}-${sanitizeSlugPart(series.lfid)}-ep-${episodeCode}`,
          title,
          objective: toObjective(input.courseCode, objectiveTitle),
          estimatedMinutes: episodeEstimatedMinutes,
          trialEnabled: Number(level.level) <= 2 && episodeOrderNo <= 3,
          videoSourceEncrypted,
          sourceKey: `${input.courseCode}:${series.lfid}:${episodeCode}`,
        });

        courseOrderNo += 1;
      }
    }
  }

  return rows;
}

async function upsertTrackAndCourse(input: {
  courseCode: LessonImportRow["courseCode"];
  publish: boolean;
}) {
  const track = await prisma.track.upsert({
    where: { code: TrackCode.ENGLISH },
    update: {},
    create: {
      code: TrackCode.ENGLISH,
      title: "English Programs",
      isTrialEnabled: true,
    },
  });

  const courseMeta: Record<
    LessonImportRow["courseCode"],
    { slug: string; title: string; description: string; durationDays: number; priceVnd: number }
  > = {
    abeka: {
      slug: "abeka",
      title: "Abeka",
      description: "Abeka external library synchronized by grade and lesson.",
      durationDays: 365,
      priceVnd: 0,
    },
    littlefox: {
      slug: "littlefox",
      title: "Little Fox EN",
      description: "Little Fox English library organized by level, series, and episode.",
      durationDays: 365,
      priceVnd: 0,
    },
    littlefoxcn: {
      slug: "littlefoxcn",
      title: "Little Fox CN",
      description: "Little Fox Chinese library organized by level, series, and episode.",
      durationDays: 365,
      priceVnd: 0,
    },
  };

  const meta = courseMeta[input.courseCode];
  const course = await prisma.course.upsert({
    where: { slug: meta.slug },
    update: {
      title: meta.title,
      description: meta.description,
      durationDays: meta.durationDays,
      priceVnd: meta.priceVnd,
      isPublished: input.publish,
    },
    create: {
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      durationDays: meta.durationDays,
      priceVnd: meta.priceVnd,
      isPublished: input.publish,
    },
  });

  return { track, course };
}

async function importRows(input: {
  rows: LessonImportRow[];
  dryRun: boolean;
  publish: boolean;
  summary: ImportSummary;
}) {
  if (input.rows.length === 0) return;

  const grouped = new Map<LessonImportRow["courseCode"], LessonImportRow[]>();
  for (const row of input.rows) {
    if (!grouped.has(row.courseCode)) {
      grouped.set(row.courseCode, []);
    }
    grouped.get(row.courseCode)!.push(row);
  }

  for (const [courseCode, rows] of grouped.entries()) {
    if (rows.length === 0) continue;
    rows.sort((a, b) => a.courseOrderNo - b.courseOrderNo);

    if (input.dryRun) {
      input.summary.lessonsPrepared += rows.length;
      continue;
    }

    const { track, course } = await upsertTrackAndCourse({
      courseCode,
      publish: input.publish,
    });

    const levelIdByOrder = new Map<number, string>();
    const unitIdByComposite = new Map<string, string>();

    for (const row of rows) {
      input.summary.lessonsPrepared += 1;

      let levelId = levelIdByOrder.get(row.levelOrderNo);
      if (!levelId) {
        const level = await prisma.level.upsert({
          where: {
            trackId_orderNo: {
              trackId: track.id,
              orderNo: row.levelOrderNo,
            },
          },
          update: {
            title: row.levelTitle,
          },
          create: {
            trackId: track.id,
            orderNo: row.levelOrderNo,
            title: row.levelTitle,
          },
          select: { id: true },
        });
        levelId = level.id;
        levelIdByOrder.set(row.levelOrderNo, levelId);
      }

      const unitKey = `${levelId}:${row.unitOrderNo}`;
      let unitId = unitIdByComposite.get(unitKey);
      if (!unitId) {
        const unit = await prisma.unit.upsert({
          where: {
            levelId_orderNo: {
              levelId,
              orderNo: row.unitOrderNo,
            },
          },
          update: {
            title: row.unitTitle,
          },
          create: {
            levelId,
            orderNo: row.unitOrderNo,
            title: row.unitTitle,
          },
          select: { id: true },
        });
        unitId = unit.id;
        unitIdByComposite.set(unitKey, unitId);
      }

      const existingLesson = await prisma.lesson.findUnique({
        where: { slug: row.slug },
        select: { id: true },
      });

      const lesson = await prisma.lesson.upsert({
        where: { slug: row.slug },
        update: {
          unitId,
          orderNo: row.lessonOrderNo,
          title: row.title,
          objective: row.objective,
          estimatedMinutes: row.estimatedMinutes,
          trialEnabled: row.trialEnabled,
          videoSource: row.videoSourceEncrypted,
          bunnyVideoId: null,
          videoStatus: row.videoSourceEncrypted ? "ready" : "none",
          isPreview: row.trialEnabled,
          offlineCardMarkdown: [
            `## ${row.title}`,
            "",
            "External content source (origin URL is protected).",
            `Source key: ${row.sourceKey}`,
          ].join("\n"),
          parentScriptMarkdown: [
            "## Parent Guide",
            "",
            "- Start lesson from inside the app to request a protected playback URL.",
            "- Do not share playback links outside authenticated sessions.",
            `- Lesson key: ${row.sourceKey}`,
          ].join("\n"),
        },
        create: {
          unitId,
          orderNo: row.lessonOrderNo,
          slug: row.slug,
          title: row.title,
          objective: row.objective,
          estimatedMinutes: row.estimatedMinutes,
          trialEnabled: row.trialEnabled,
          videoSource: row.videoSourceEncrypted,
          bunnyVideoId: null,
          videoStatus: row.videoSourceEncrypted ? "ready" : "none",
          isPreview: row.trialEnabled,
          offlineCardMarkdown: [
            `## ${row.title}`,
            "",
            "External content source (origin URL is protected).",
            `Source key: ${row.sourceKey}`,
          ].join("\n"),
          parentScriptMarkdown: [
            "## Parent Guide",
            "",
            "- Start lesson from inside the app to request a protected playback URL.",
            "- Do not share playback links outside authenticated sessions.",
            `- Lesson key: ${row.sourceKey}`,
          ].join("\n"),
        },
        select: { id: true },
      });

      if (existingLesson) input.summary.lessonsUpdated += 1;
      else input.summary.lessonsCreated += 1;

      const existingCourseLesson = await prisma.courseLesson.findUnique({
        where: {
          courseId_lessonId: {
            courseId: course.id,
            lessonId: lesson.id,
          },
        },
        select: { id: true },
      });

      await prisma.courseLesson.upsert({
        where: {
          courseId_lessonId: {
            courseId: course.id,
            lessonId: lesson.id,
          },
        },
        update: {
          orderNo: row.courseOrderNo,
        },
        create: {
          courseId: course.id,
          lessonId: lesson.id,
          orderNo: row.courseOrderNo,
        },
      });

      if (existingCourseLesson) input.summary.courseLessonsUpdated += 1;
      else input.summary.courseLessonsCreated += 1;
    }
  }
}

async function main() {
  const rootDir = process.cwd();
  const bootstrapPath = path.resolve(
    getArg("--bootstrap") ?? path.join(rootDir, "docs", "api", "program-bootstrap", "three-courses-program.json"),
  );
  const apiRoot = path.resolve(getArg("--api-root") ?? path.join(rootDir, "docs", "api"));
  const dryRun = hasFlag("--dry-run");
  const publish = hasFlag("--publish");
  const sessionSecret = getSessionSecret();

  if (!fs.existsSync(bootstrapPath)) {
    throw new Error(`Bootstrap JSON not found: ${bootstrapPath}`);
  }

  const bootstrapRoot = readJson<BootstrapRoot>(bootstrapPath);
  const summary: ImportSummary = {
    lessonsPrepared: 0,
    lessonsCreated: 0,
    lessonsUpdated: 0,
    courseLessonsCreated: 0,
    courseLessonsUpdated: 0,
    blockedVideoHostCount: 0,
    blockedVideoHostSamples: [],
    missingSourceCount: 0,
    missingSourceSamples: [],
  };

  const abekaCourse = getBootstrapCourse(bootstrapRoot, "abeka") as Extract<BootstrapCourse, { courseCode: "abeka" }>;
  const littlefoxCourse = getBootstrapCourse(bootstrapRoot, "littlefox") as Extract<
    BootstrapCourse,
    { courseCode: "littlefox" | "littlefoxcn" }
  >;
  const littlefoxCnCourse = getBootstrapCourse(bootstrapRoot, "littlefoxcn") as Extract<
    BootstrapCourse,
    { courseCode: "littlefox" | "littlefoxcn" }
  >;

  const rows: LessonImportRow[] = [
    ...buildAbekaRows({
      apiRoot,
      bootstrap: abekaCourse,
      sessionSecret,
      summary,
    }),
    ...buildLittleFoxRows({
      apiRoot,
      courseCode: "littlefox",
      bootstrap: littlefoxCourse,
      sessionSecret,
      summary,
    }),
    ...buildLittleFoxRows({
      apiRoot,
      courseCode: "littlefoxcn",
      bootstrap: littlefoxCnCourse,
      sessionSecret,
      summary,
    }),
  ];

  await importRows({
    rows,
    dryRun,
    publish,
    summary,
  });

  console.log(
    JSON.stringify(
      {
        dryRun,
        publish,
        bootstrapPath,
        apiRoot,
        totals: {
          rowsBuilt: rows.length,
          ...summary,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
