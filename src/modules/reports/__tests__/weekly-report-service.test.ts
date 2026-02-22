import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, randomUuidMock } = vi.hoisted(() => ({
  prismaMock: {
    lessonCompletion: {
      findMany: vi.fn(),
    },
    weeklyReport: {
      upsert: vi.fn(),
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

describe("getWeeklyWindow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns monday as week start and sunday as week end", () => {
    const { weekStart, weekEnd } = getWeeklyWindow(new Date("2026-02-20T12:00:00"));

    expect(weekStart.getDay()).toBe(1);
    expect(weekEnd.getDay()).toBe(0);
    expect(weekEnd.getTime()).toBeGreaterThan(weekStart.getTime());
  });
});

describe("generateWeeklyReportForChild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates completion metrics by track and queues report email", async () => {
    prismaMock.lessonCompletion.findMany.mockResolvedValueOnce([
      {
        minutesLearned: 12,
        quizScore: 80,
        completedAt: new Date("2026-02-16T02:00:00.000Z"),
        lesson: {
          unit: {
            level: {
              track: {
                code: "ENGLISH",
              },
            },
          },
        },
      },
      {
        minutesLearned: 15,
        quizScore: 100,
        completedAt: new Date("2026-02-17T03:00:00.000Z"),
        lesson: {
          unit: {
            level: {
              track: {
                code: "ENGLISH",
              },
            },
          },
        },
      },
      {
        minutesLearned: 10,
        quizScore: 90,
        completedAt: new Date("2026-02-18T04:00:00.000Z"),
        lesson: {
          unit: {
            level: {
              track: {
                code: "MATH",
              },
            },
          },
        },
      },
    ]);
    prismaMock.weeklyReport.upsert.mockResolvedValueOnce({
      id: "report-1",
    });

    const result = await generateWeeklyReportForChild("child-1", new Date("2026-02-20T12:00:00.000Z"));

    expect(result).toEqual({ id: "report-1" });
    expect(prismaMock.lessonCompletion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          childId: "child-1",
        }),
      }),
    );
    expect(prismaMock.weeklyReport.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          childId: "child-1",
          minutesLearned: 37,
          lessonsCompleted: 3,
          streakDays: 3,
          emailStatus: "QUEUED",
          deepLinkToken: "weekly-token-fixed",
          skillsSummary: {
            ENGLISH: { lessons: 2, avgQuiz: 90 },
            MATH: { lessons: 1, avgQuiz: 90 },
          },
        }),
        update: expect.objectContaining({
          minutesLearned: 37,
          lessonsCompleted: 3,
          streakDays: 3,
          emailStatus: "QUEUED",
          deliveredEmailAt: null,
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
  });

  it("generates weekly reports for parent children and for all children", async () => {
    prismaMock.childProfile.findMany
      .mockResolvedValueOnce([{ id: "child-a" }, { id: "child-b" }])
      .mockResolvedValueOnce([{ id: "child-c" }]);
    prismaMock.lessonCompletion.findMany.mockResolvedValue([]);
    prismaMock.weeklyReport.upsert
      .mockResolvedValueOnce({ id: "report-a" })
      .mockResolvedValueOnce({ id: "report-b" })
      .mockResolvedValueOnce({ id: "report-c" });

    const parentReports = await generateWeeklyReportsForParent("parent-1", new Date("2026-02-20T12:00:00.000Z"));
    const allReports = await generateWeeklyReportsForAllChildren(new Date("2026-02-20T12:00:00.000Z"));

    expect(parentReports).toHaveLength(2);
    expect(allReports).toHaveLength(1);
    expect(prismaMock.childProfile.findMany).toHaveBeenNthCalledWith(1, { where: { parentId: "parent-1" } });
    expect(prismaMock.childProfile.findMany).toHaveBeenNthCalledWith(2, { select: { id: true } });
    expect(prismaMock.weeklyReport.upsert).toHaveBeenCalledTimes(3);
  });
});
