import { endOfWeek, startOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { randomUUID } from "node:crypto";
import { EmailStatus, Prisma, type WeeklyReport } from "@prisma/client";
import { prisma } from "@/lib/db";
import { enrichWeeklyReport } from "@/modules/adaptive/weekly-report-enricher";

const REPORT_TIMEZONE = "Asia/Bangkok";

export type WeeklyTrend = {
  lessonsChange: number;
  minutesChange: number;
  streakChange: number;
  overallDirection: "up" | "down" | "stable";
};

function computeStreakDays(completionDates: Date[]) {
  const uniqueDayKeys = Array.from(
    new Set(completionDates.map((date) => formatInTimeZone(date, REPORT_TIMEZONE, "yyyy-MM-dd"))),
  ).sort((a, b) => a.localeCompare(b));

  if (uniqueDayKeys.length === 0) {
    return 0;
  }

  let maxStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < uniqueDayKeys.length; index += 1) {
    const prev = new Date(`${uniqueDayKeys[index - 1]}T00:00:00.000Z`).getTime();
    const current = new Date(`${uniqueDayKeys[index]}T00:00:00.000Z`).getTime();
    const dayDiff = Math.round((current - prev) / (24 * 60 * 60 * 1000));

    if (dayDiff === 1) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
      continue;
    }

    currentStreak = 1;
  }

  return maxStreak;
}

export function getWeeklyTrend(
  childId: string,
  currentReport: Pick<WeeklyReport, "lessonsCompleted" | "minutesLearned" | "streakDays">,
  previousReport: Pick<WeeklyReport, "lessonsCompleted" | "minutesLearned" | "streakDays"> | null,
): WeeklyTrend {
  if (!childId || !previousReport) {
    return {
      lessonsChange: 0,
      minutesChange: 0,
      streakChange: 0,
      overallDirection: "stable",
    };
  }

  const lessonsChange = currentReport.lessonsCompleted - previousReport.lessonsCompleted;
  const minutesChange = currentReport.minutesLearned - previousReport.minutesLearned;
  const streakChange = currentReport.streakDays - previousReport.streakDays;

  const positiveCount = [lessonsChange, minutesChange, streakChange].filter((value) => value > 0).length;
  const negativeCount = [lessonsChange, minutesChange, streakChange].filter((value) => value < 0).length;

  let overallDirection: WeeklyTrend["overallDirection"] = "stable";
  if (positiveCount > 0 && negativeCount === 0) {
    overallDirection = "up";
  } else if (negativeCount > 0 && positiveCount === 0) {
    overallDirection = "down";
  } else if (positiveCount > 0 && negativeCount > 0) {
    const aggregateChange = lessonsChange + minutesChange + streakChange;
    if (aggregateChange > 0) {
      overallDirection = "up";
    } else if (aggregateChange < 0) {
      overallDirection = "down";
    }
  }

  return {
    lessonsChange,
    minutesChange,
    streakChange,
    overallDirection,
  };
}

export function getWeeklyWindow(referenceDate = new Date()) {
  const zonedReference = toZonedTime(referenceDate, REPORT_TIMEZONE);
  const zonedWeekStart = startOfWeek(zonedReference, { weekStartsOn: 1 });
  const zonedWeekEnd = endOfWeek(zonedReference, { weekStartsOn: 1 });

  const weekStart = fromZonedTime(zonedWeekStart, REPORT_TIMEZONE);
  const weekEnd = fromZonedTime(zonedWeekEnd, REPORT_TIMEZONE);

  return { weekStart, weekEnd };
}

export async function generateWeeklyReportForChild(childId: string, referenceDate = new Date()) {
  const { weekStart, weekEnd } = getWeeklyWindow(referenceDate);

  const existingReport = await prisma.weeklyReport.findUnique({
    where: {
      childId_weekStart: {
        childId,
        weekStart,
      },
    },
  });

  if (existingReport) {
    return existingReport;
  }

  const [completions, child] = await Promise.all([
    prisma.lessonCompletion.findMany({
      where: {
        childId,
        completedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                level: {
                  include: {
                    track: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.childProfile.findUnique({
      where: { id: childId },
      select: { adaptiveEnabled: true },
    }),
  ]);

  const minutesLearned = completions.reduce((total, completion) => total + completion.minutesLearned, 0);
  const lessonsCompleted = completions.length;
  const streakDays = computeStreakDays(completions.map((completion) => completion.completedAt));

  const byTrack = completions.reduce<Record<string, { lessons: number; avgQuiz: number }>>(
    (acc, completion) => {
      const trackCode = completion.lesson.unit.level.track.code;
      const current = acc[trackCode] ?? { lessons: 0, avgQuiz: 0 };
      const nextLessons = current.lessons + 1;
      const nextAvgQuiz = (current.avgQuiz * current.lessons + completion.quizScore) / nextLessons;

      acc[trackCode] = {
        lessons: nextLessons,
        avgQuiz: Math.round(nextAvgQuiz),
      };

      return acc;
    },
    {},
  );

  // Enrich with adaptive skill data when enabled
  const enrichedSkills = child?.adaptiveEnabled
    ? await enrichWeeklyReport(childId, weekStart, weekEnd).catch(() => null)
    : null;

  const skillsSummaryData: Prisma.InputJsonValue = enrichedSkills
    ? { ...byTrack, adaptive: enrichedSkills as unknown as Prisma.InputJsonValue }
    : byTrack;

  const reportData: Prisma.WeeklyReportUncheckedCreateInput = {
    childId,
    weekStart,
    weekEnd,
    minutesLearned,
    lessonsCompleted,
    streakDays,
    skillsSummary: skillsSummaryData,
    recommendations: {
      nextWeek: [
        "Duy trì thói quen học 15-20 phút mỗi ngày để đạt hiệu quả tốt nhất",
        "Ôn tập lại các trò chơi nhỏ ôn tập (D+1, D+3) để ghi nhớ bài",
        "Kết hợp thêm 1 hoạt động tương tác gia đình (offline) của Cùng Con Tự Học",
      ],
    },
    deliveredInAppAt: new Date(),
    emailStatus: EmailStatus.QUEUED,
    deepLinkToken: randomUUID(),
  };

  try {
    return await prisma.weeklyReport.create({
      data: reportData,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrentReport = await prisma.weeklyReport.findUnique({
        where: {
          childId_weekStart: {
            childId,
            weekStart,
          },
        },
      });

      if (concurrentReport) {
        return concurrentReport;
      }
    }

    throw error;
  }
}

export async function getLatestWeeklyReports(parentId: string) {
  return prisma.weeklyReport.findMany({
    where: {
      child: {
        parentId,
      },
    },
    include: {
      child: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
    orderBy: {
      generatedAt: "desc",
    },
    take: 12,
  });
}

export async function getLatestWeeklyReportsForChild(childId: string, limit = 12) {
  return prisma.weeklyReport.findMany({
    where: {
      childId,
    },
    orderBy: {
      generatedAt: "desc",
    },
    take: limit,
  });
}

export async function generateWeeklyReportsForParent(parentId: string, referenceDate = new Date()) {
  const children = await prisma.childProfile.findMany({
    where: { parentId },
    select: { id: true },
  });

  return Promise.all(children.map((child) => generateWeeklyReportForChild(child.id, referenceDate)));
}

export async function generateWeeklyReportsForAllChildren(referenceDate = new Date()) {
  const children = await prisma.childProfile.findMany({
    select: { id: true },
  });

  return Promise.all(children.map((child) => generateWeeklyReportForChild(child.id, referenceDate)));
}
