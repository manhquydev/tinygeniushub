import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatInTimeZone } from "date-fns-tz";

const { prismaMock, randomUuidMock } = vi.hoisted(() => ({
  prismaMock: {
    lessonCompletion: {
      findMany: vi.fn(),
    },
    weeklyReport: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    childProfile: {
      findMany: vi.fn(),
    },
  },
  randomUuidMock: vi.fn(() => "weekly-token-fixed"),
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return {
    ...actual,
    randomUUID: randomUuidMock,
  };
});

import {
  generateWeeklyReportForChild,
  generateWeeklyReportsForAllChildren,
  generateWeeklyReportsForParent,
  getLatestWeeklyReports,
  getLatestWeeklyReportsForChild,
  getWeeklyWindow,
} from "@/modules/reports/weekly-report-service";

function makeCompletion({
  completedAt,
  minutesLearned = 10,
  quizScore = 90,
  trackCode = "ENGLISH",
}: {
  completedAt: string;
  minutesLearned?: number;
  quizScore?: number;
  trackCode?: string;
}) {
  return {
    minutesLearned,
    quizScore,
    completedAt: new Date(completedAt),
    lesson: {
      unit: {
        level: {
          track: {
            code: trackCode,
          },
        },
      },
    },
  };
}

describe("getWeeklyWindow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns monday as week start and sunday as week end", () => {
    const { weekStart, weekEnd } = getWeeklyWindow(new Date("2026-02-20T12:00:00.000Z"));

    expect(formatInTimeZone(weekStart, "Asia/Bangkok", "i")).toBe("1");
    expect(formatInTimeZone(weekEnd, "Asia/Bangkok", "i")).toBe("7");
    expect(weekEnd.getTime()).toBeGreaterThan(weekStart.getTime());
  });
});

describe("generateWeeklyReportForChild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.weeklyReport.findUnique.mockResolvedValue(null);
  });

  it("no completions in week -> minutesLearned: 0, lessonsCompleted: 0, streakDays: 0", async () => {
    prismaMock.lessonCompletion.findMany.mockResolvedValueOnce([]);
    prismaMock.weeklyReport.create.mockResolvedValueOnce({
      id: "report-empty",
      childId: "child-empty",
      minutesLearned: 0,
      lessonsCompleted: 0,
      streakDays: 0,
    });

    await generateWeeklyReportForChild("child-empty", new Date("2026-02-20T12:00:00.000Z"));

    expect(prismaMock.weeklyReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          childId: "child-empty",
          minutesLearned: 0,
          lessonsCompleted: 0,
          streakDays: 0,
        }),
      }),
    );
  });

  it("3 completions of 10 minutes each -> minutesLearned: 30, lessonsCompleted: 3", async () => {
    prismaMock.lessonCompletion.findMany.mockResolvedValueOnce([
      makeCompletion({ completedAt: "2026-02-16T02:00:00.000Z", trackCode: "ENGLISH" }),
      makeCompletion({ completedAt: "2026-02-17T02:00:00.000Z", trackCode: "MATH" }),
      makeCompletion({ completedAt: "2026-02-18T02:00:00.000Z", trackCode: "ENGLISH" }),
    ]);
    prismaMock.weeklyReport.create.mockResolvedValueOnce({
      id: "report-30",
      childId: "child-30",
      minutesLearned: 30,
      lessonsCompleted: 3,
      streakDays: 3,
    });

    await generateWeeklyReportForChild("child-30", new Date("2026-02-20T12:00:00.000Z"));

    expect(prismaMock.weeklyReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          childId: "child-30",
          minutesLearned: 30,
          lessonsCompleted: 3,
        }),
      }),
    );
  });

  it("duplicate call for same childId + weekStart -> returns existing, no duplicate insert", async () => {
    const existingReport = {
      id: "report-existing",
      childId: "child-dup",
      minutesLearned: 10,
      lessonsCompleted: 1,
      streakDays: 1,
    };

    prismaMock.weeklyReport.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingReport);
    prismaMock.lessonCompletion.findMany.mockResolvedValueOnce([
      makeCompletion({ completedAt: "2026-02-17T03:00:00.000Z" }),
    ]);
    prismaMock.weeklyReport.create.mockResolvedValueOnce(existingReport);

    const first = await generateWeeklyReportForChild("child-dup", new Date("2026-02-20T12:00:00.000Z"));
    const second = await generateWeeklyReportForChild("child-dup", new Date("2026-02-20T12:00:00.000Z"));

    expect(first).toEqual(existingReport);
    expect(second).toEqual(existingReport);
    expect(prismaMock.weeklyReport.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.lessonCompletion.findMany).toHaveBeenCalledTimes(1);
  });

  it("streakDays counts consecutive days, gap breaks streak", async () => {
    prismaMock.lessonCompletion.findMany.mockResolvedValueOnce([
      makeCompletion({ completedAt: "2026-02-16T02:00:00.000Z" }), // Monday
      makeCompletion({ completedAt: "2026-02-17T03:00:00.000Z" }), // Tuesday
      makeCompletion({ completedAt: "2026-02-19T04:00:00.000Z" }), // Thursday
    ]);
    prismaMock.weeklyReport.create.mockResolvedValueOnce({
      id: "report-gap",
      childId: "child-gap",
      streakDays: 2,
    });

    await generateWeeklyReportForChild("child-gap", new Date("2026-02-20T12:00:00.000Z"));

    expect(prismaMock.weeklyReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          streakDays: 2,
        }),
      }),
    );
  });
});

describe("weekly report query helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads latest reports for parent and child with correct query options", async () => {
    prismaMock.weeklyReport.findMany
      .mockResolvedValueOnce([{ id: "parent-report" }])
      .mockResolvedValueOnce([{ id: "child-report" }]);

    const parentReports = await getLatestWeeklyReports("parent-1");
    const childReports = await getLatestWeeklyReportsForChild("child-1", 5);

    expect(parentReports).toEqual([{ id: "parent-report" }]);
    expect(childReports).toEqual([{ id: "child-report" }]);
    expect(prismaMock.weeklyReport.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          child: {
            parentId: "parent-1",
          },
        },
        take: 12,
      }),
    );
    expect(prismaMock.weeklyReport.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { childId: "child-1" },
        take: 5,
      }),
    );
  });
});

describe("weekly report batch generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.weeklyReport.findUnique.mockResolvedValue(null);
  });

  it("generates weekly reports for parent children and for all children", async () => {
    prismaMock.childProfile.findMany
      .mockResolvedValueOnce([{ id: "child-a" }, { id: "child-b" }])
      .mockResolvedValueOnce([{ id: "child-c" }]);
    prismaMock.lessonCompletion.findMany.mockResolvedValue([]);
    prismaMock.weeklyReport.create
      .mockResolvedValueOnce({ id: "report-a" })
      .mockResolvedValueOnce({ id: "report-b" })
      .mockResolvedValueOnce({ id: "report-c" });

    const parentReports = await generateWeeklyReportsForParent("parent-1", new Date("2026-02-20T12:00:00.000Z"));
    const allReports = await generateWeeklyReportsForAllChildren(new Date("2026-02-20T12:00:00.000Z"));

    expect(parentReports).toHaveLength(2);
    expect(allReports).toHaveLength(1);
    expect(prismaMock.childProfile.findMany).toHaveBeenNthCalledWith(1, {
      where: { parentId: "parent-1" },
      select: { id: true },
    });
    expect(prismaMock.childProfile.findMany).toHaveBeenNthCalledWith(2, { select: { id: true } });
    expect(prismaMock.weeklyReport.create).toHaveBeenCalledTimes(3);
  });
});
