import fs from "node:fs";
import path from "node:path";
import { subDays } from "date-fns";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = process.cwd();
const reportsDir = path.join(root, "plans", "2026-03-17-education-agent-team", "reports");
const outJsonPath = path.join(reportsDir, "pilot-funnel-report.json");
const outMdPath = path.join(reportsDir, "pilot-funnel-report.md");

const PILOT_SKU_SLUGS = [
  "abeka-k4-intro-4w",
  "abeka-k4-foundation-8w",
  "abeka-k5-intro-4w",
  "abeka-k5-foundation-8w",
  "abeka-g1-intro-4w",
  "abeka-g1-foundation-8w",
  "lfen-l1-starter-6w",
  "lfen-l1-builder-8w",
  "lfen-l2-starter-6w",
  "lfen-l2-builder-8w",
  "lfcn-l1-starter-5w",
  "lfcn-l1-builder-8w",
];

function parseDaysArg() {
  const daysArg = process.argv.find((arg) => arg.startsWith("--days="));
  if (!daysArg) return 14;
  const raw = Number.parseInt(daysArg.split("=")[1] ?? "14", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 14;
}

function parseCourseIdFromResourceId(resourceId) {
  if (typeof resourceId !== "string") return null;
  const parts = resourceId.split(":");
  return parts.length >= 2 ? parts[1] : null;
}

function parseChildIdFromMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return null;
  const childId = metadata.childId;
  return typeof childId === "string" && childId.length > 0 ? childId : null;
}

function parseAttributionChannelFromMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return "unknown";
  const value = metadata.attributionChannel;
  return typeof value === "string" && value.length > 0 ? value : "unknown";
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function mdTable(rows) {
  const header = [
    "| SKU slug | Checkout start | Purchase | Enrollment | Lesson completed | Active learners | Checkout->Purchase | Purchase->Active | Avg lessons/learner |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  const body = rows.map(
    (row) =>
      `| ${row.slug} | ${row.checkoutStarted} | ${row.purchaseSucceeded} | ${row.enrollments} | ${row.lessonCompleted} | ${row.activeLearners} | ${row.checkoutToPurchaseRatePct}% | ${row.purchaseToActiveLearnerRatePct}% | ${row.avgLessonsPerActiveLearner} |`,
  );
  return [...header, ...body].join("\n");
}

function mdChannelTable(rows) {
  const header = [
    "| SKU slug | Channel | Checkout start | Purchase | Checkout->Purchase |",
    "|---|---|---:|---:|---:|",
  ];
  const body = rows.map(
    (row) =>
      `| ${row.slug} | ${row.channel} | ${row.checkoutStarted} | ${row.purchaseSucceeded} | ${row.checkoutToPurchaseRatePct}% |`,
  );
  return [...header, ...body].join("\n");
}

async function main() {
  const days = parseDaysArg();
  const since = subDays(new Date(), days);

  const courses = await prisma.course.findMany({
    where: {
      slug: {
        in: PILOT_SKU_SLUGS,
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  const slugOrder = new Map(PILOT_SKU_SLUGS.map((slug, index) => [slug, index]));
  const coursesSorted = [...courses].sort((a, b) => (slugOrder.get(a.slug) ?? 999) - (slugOrder.get(b.slug) ?? 999));
  const courseById = new Map(coursesSorted.map((course) => [course.id, course]));
  const courseIds = coursesSorted.map((course) => course.id);

  const [checkoutLogs, purchaseLogs, lessonLogs, enrollments] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        action: "pilot_checkout_started",
        resourceType: "pilot_course",
        createdAt: {
          gte: since,
        },
      },
      select: {
        resourceId: true,
        metadata: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        action: "pilot_purchase_succeeded",
        resourceType: "pilot_course",
        createdAt: {
          gte: since,
        },
      },
      select: {
        resourceId: true,
        metadata: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        action: "pilot_lesson_completed",
        resourceType: "pilot_course",
        createdAt: {
          gte: since,
        },
      },
      select: {
        resourceId: true,
        metadata: true,
      },
    }),
    prisma.courseEnrollment.groupBy({
      by: ["courseId"],
      where: {
        courseId: {
          in: courseIds,
        },
        enrolledAt: {
          gte: since,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const checkoutCountByCourseId = new Map();
  const checkoutCountByCourseChannel = new Map();
  for (const row of checkoutLogs) {
    const courseId = parseCourseIdFromResourceId(row.resourceId);
    if (!courseId || !courseById.has(courseId)) continue;
    checkoutCountByCourseId.set(courseId, (checkoutCountByCourseId.get(courseId) ?? 0) + 1);
    const channel = parseAttributionChannelFromMetadata(row.metadata);
    const key = `${courseId}:${channel}`;
    checkoutCountByCourseChannel.set(key, (checkoutCountByCourseChannel.get(key) ?? 0) + 1);
  }

  const purchaseCountByCourseId = new Map();
  const purchaseCountByCourseChannel = new Map();
  for (const row of purchaseLogs) {
    const courseId = parseCourseIdFromResourceId(row.resourceId);
    if (!courseId || !courseById.has(courseId)) continue;
    purchaseCountByCourseId.set(courseId, (purchaseCountByCourseId.get(courseId) ?? 0) + 1);
    const channel = parseAttributionChannelFromMetadata(row.metadata);
    const key = `${courseId}:${channel}`;
    purchaseCountByCourseChannel.set(key, (purchaseCountByCourseChannel.get(key) ?? 0) + 1);
  }

  const lessonCountByCourseId = new Map();
  const learnerSetByCourseId = new Map();
  for (const row of lessonLogs) {
    const courseId = parseCourseIdFromResourceId(row.resourceId);
    if (!courseId || !courseById.has(courseId)) continue;
    lessonCountByCourseId.set(courseId, (lessonCountByCourseId.get(courseId) ?? 0) + 1);

    const childId = parseChildIdFromMetadata(row.metadata);
    if (!childId) continue;
    if (!learnerSetByCourseId.has(courseId)) {
      learnerSetByCourseId.set(courseId, new Set());
    }
    learnerSetByCourseId.get(courseId).add(childId);
  }

  const enrollmentCountByCourseId = new Map(
    enrollments.map((row) => [row.courseId, row._count._all]),
  );

  const rows = coursesSorted.map((course) => {
    const checkoutStarted = checkoutCountByCourseId.get(course.id) ?? 0;
    const purchaseSucceeded = purchaseCountByCourseId.get(course.id) ?? 0;
    const lessonCompleted = lessonCountByCourseId.get(course.id) ?? 0;
    const enrollmentsCount = enrollmentCountByCourseId.get(course.id) ?? 0;
    const activeLearners = learnerSetByCourseId.get(course.id)?.size ?? 0;
    const checkoutToPurchaseRatePct = pct(purchaseSucceeded, checkoutStarted);
    const purchaseToActiveLearnerRatePct = pct(activeLearners, purchaseSucceeded);
    const avgLessonsPerActiveLearner =
      activeLearners > 0 ? Number((lessonCompleted / activeLearners).toFixed(2)) : 0;

    return {
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      checkoutStarted,
      purchaseSucceeded,
      enrollments: enrollmentsCount,
      lessonCompleted,
      activeLearners,
      checkoutToPurchaseRatePct,
      purchaseToActiveLearnerRatePct,
      avgLessonsPerActiveLearner,
    };
  });

  const channelRows = [];
  const channelSetByCourseId = new Map();
  for (const key of checkoutCountByCourseChannel.keys()) {
    const [courseId, channel] = key.split(":");
    if (!courseId || !channel) continue;
    if (!channelSetByCourseId.has(courseId)) {
      channelSetByCourseId.set(courseId, new Set());
    }
    channelSetByCourseId.get(courseId).add(channel);
  }
  for (const key of purchaseCountByCourseChannel.keys()) {
    const [courseId, channel] = key.split(":");
    if (!courseId || !channel) continue;
    if (!channelSetByCourseId.has(courseId)) {
      channelSetByCourseId.set(courseId, new Set());
    }
    channelSetByCourseId.get(courseId).add(channel);
  }

  for (const course of coursesSorted) {
    const channels = channelSetByCourseId.get(course.id);
    if (!channels || channels.size === 0) continue;
    for (const channel of channels) {
      const checkoutStarted = checkoutCountByCourseChannel.get(`${course.id}:${channel}`) ?? 0;
      const purchaseSucceeded = purchaseCountByCourseChannel.get(`${course.id}:${channel}`) ?? 0;
      channelRows.push({
        courseId: course.id,
        slug: course.slug,
        channel,
        checkoutStarted,
        purchaseSucceeded,
        checkoutToPurchaseRatePct: pct(purchaseSucceeded, checkoutStarted),
      });
    }
  }

  channelRows.sort((a, b) => {
    if (a.slug !== b.slug) return a.slug.localeCompare(b.slug);
    return a.channel.localeCompare(b.channel);
  });

  const channelTotalsMap = new Map();
  for (const row of channelRows) {
    const existing = channelTotalsMap.get(row.channel) ?? {
      channel: row.channel,
      checkoutStarted: 0,
      purchaseSucceeded: 0,
      checkoutToPurchaseRatePct: 0,
    };
    existing.checkoutStarted += row.checkoutStarted;
    existing.purchaseSucceeded += row.purchaseSucceeded;
    channelTotalsMap.set(row.channel, existing);
  }

  const channelTotals = [...channelTotalsMap.values()]
    .map((item) => ({
      ...item,
      checkoutToPurchaseRatePct: pct(item.purchaseSucceeded, item.checkoutStarted),
    }))
    .sort((a, b) => a.channel.localeCompare(b.channel));

  const totals = rows.reduce(
    (acc, row) => {
      acc.checkoutStarted += row.checkoutStarted;
      acc.purchaseSucceeded += row.purchaseSucceeded;
      acc.enrollments += row.enrollments;
      acc.lessonCompleted += row.lessonCompleted;
      acc.activeLearners += row.activeLearners;
      return acc;
    },
    {
      checkoutStarted: 0,
      purchaseSucceeded: 0,
      enrollments: 0,
      lessonCompleted: 0,
      activeLearners: 0,
    },
  );

  const out = {
    generatedAt: new Date().toISOString(),
    periodDays: days,
    since: since.toISOString(),
    summary: {
      totalCoursesFound: rows.length,
      missingCoursesFromCatalog: PILOT_SKU_SLUGS.filter((slug) => !rows.some((row) => row.slug === slug)),
      totals: {
        ...totals,
        checkoutToPurchaseRatePct: pct(totals.purchaseSucceeded, totals.checkoutStarted),
        purchaseToActiveLearnerRatePct: pct(totals.activeLearners, totals.purchaseSucceeded),
      },
      channelTotals,
    },
    rows,
    channelRows,
  };

  const lines = [];
  lines.push("# Pilot Funnel Report");
  lines.push("");
  lines.push(`Generated at: ${out.generatedAt}`);
  lines.push(`Window: last ${days} days (since ${since.toISOString()})`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Courses found: ${out.summary.totalCoursesFound}/${PILOT_SKU_SLUGS.length}`);
  lines.push(`- Checkout started: ${totals.checkoutStarted}`);
  lines.push(`- Purchase succeeded: ${totals.purchaseSucceeded}`);
  lines.push(`- Enrollments: ${totals.enrollments}`);
  lines.push(`- Lesson completed events: ${totals.lessonCompleted}`);
  lines.push(`- Active learners: ${totals.activeLearners}`);
  lines.push(`- Checkout -> Purchase: ${out.summary.totals.checkoutToPurchaseRatePct}%`);
  lines.push(`- Purchase -> Active learner: ${out.summary.totals.purchaseToActiveLearnerRatePct}%`);
  lines.push("");
  lines.push("## Per SKU");
  lines.push(mdTable(rows));
  lines.push("");
  lines.push("## Per SKU x Channel");
  if (channelRows.length > 0) {
    lines.push(mdChannelTable(channelRows));
  } else {
    lines.push("- No channel-attributed checkout/purchase events in this window.");
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("- Checkout/Purchase/Lesson events are sourced from audit logs.");
  lines.push("- Enrollment is sourced from course_enrollment.");
  lines.push("- Funnel is deterministic for pilot SKUs only.");
  lines.push("");

  fs.writeFileSync(outJsonPath, JSON.stringify(out, null, 2));
  fs.writeFileSync(outMdPath, `${lines.join("\n")}\n`);

  console.log(`Wrote ${outJsonPath}`);
  console.log(`Wrote ${outMdPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
