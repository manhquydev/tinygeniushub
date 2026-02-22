import { endOfWeek, startOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { randomUUID } from "node:crypto";
import { EmailStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const REPORT_TIMEZONE = "Asia/Bangkok";

function computeStreakDays(completionDates: Date[]) {
  const uniqueDays = new Set(
    completionDates.map((date) => formatInTimeZone(date, REPORT_TIMEZONE, "yyyy-MM-dd")),
  );

  return uniqueDays.size;
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

  const completions = await prisma.lessonCompletion.findMany({
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
  });

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

  return prisma.weeklyReport.upsert({
    where: {
      childId_weekStart: {
        childId,
        weekStart,
      },
    },
    create: {
      childId,
      weekStart,
      weekEnd,
      minutesLearned,
      lessonsCompleted,
      streakDays,
      skillsSummary: byTrack,
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
    },
    update: {
      weekEnd,
      minutesLearned,
      lessonsCompleted,
      streakDays,
      skillsSummary: byTrack,
      recommendations: {
        nextWeek: [
          "Duy trì thói quen học 15-20 phút mỗi ngày để đạt hiệu quả tốt nhất",
          "Ôn tập lại các trò chơi nhỏ ôn tập (D+1, D+3) để ghi nhớ bài",
          "Kết hợp thêm 1 hoạt động tương tác gia đình (offline) của Cùng Con Tự Học",
        ],
      },
      deliveredInAppAt: new Date(),
      deliveredEmailAt: null,
      emailStatus: EmailStatus.QUEUED,
    },
  });
}

export async function getLatestWeeklyReports(parentId: string) {
  return prisma.weeklyReport.findMany({
    where: {
      child: {
        parentId,
      },
    },
    include: {
      child: true,
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
  });

  return Promise.all(children.map((child) => generateWeeklyReportForChild(child.id, referenceDate)));
}

export async function generateWeeklyReportsForAllChildren(referenceDate = new Date()) {
  const children = await prisma.childProfile.findMany({
    select: { id: true },
  });

  return Promise.all(children.map((child) => generateWeeklyReportForChild(child.id, referenceDate)));
}
