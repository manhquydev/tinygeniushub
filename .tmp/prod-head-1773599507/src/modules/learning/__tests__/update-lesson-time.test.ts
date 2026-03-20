import { beforeEach, describe, expect, it, vi } from "vitest";

const { getParentFromServerCookieMock, prismaMock } = vi.hoisted(() => ({
  getParentFromServerCookieMock: vi.fn(),
  prismaMock: {
    childProfile: {
      findFirst: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getParentFromServerCookie: getParentFromServerCookieMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { updateLessonTime } from "@/modules/learning/update-lesson-time";

describe("updateLessonTime server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getParentFromServerCookieMock.mockResolvedValue({ id: "parent-1" });
    prismaMock.childProfile.findFirst.mockResolvedValue({ id: "child-1" });
    prismaMock.lesson.findUnique.mockResolvedValue({ id: "lesson-1" });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: { $queryRaw: ReturnType<typeof vi.fn> }) => Promise<unknown>) =>
      callback({
        $queryRaw: vi.fn().mockResolvedValue([
          {
            childId: "child-1",
            lessonId: "lesson-1",
            timeSpent: 155,
            lastAccessedAt: new Date("2026-02-22T10:15:00.000Z"),
          },
        ]),
      }),
    );
  });

  it("throws UNAUTHORIZED when parent session is missing", async () => {
    getParentFromServerCookieMock.mockResolvedValueOnce(null);

    await expect(
      updateLessonTime({
        childId: "child-1",
        lessonId: "lesson-1",
        secondsSpent: 60,
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });

  it("throws CHILD_NOT_FOUND when child does not belong to parent", async () => {
    prismaMock.childProfile.findFirst.mockResolvedValueOnce(null);

    await expect(
      updateLessonTime({
        childId: "child-1",
        lessonId: "lesson-1",
        secondsSpent: 60,
      }),
    ).rejects.toMatchObject({
      code: "CHILD_NOT_FOUND",
      status: 404,
    });
  });

  it("throws LESSON_NOT_FOUND when lesson does not exist", async () => {
    prismaMock.lesson.findUnique.mockResolvedValueOnce(null);

    await expect(
      updateLessonTime({
        childId: "child-1",
        lessonId: "lesson-1",
        secondsSpent: 60,
      }),
    ).rejects.toMatchObject({
      code: "LESSON_NOT_FOUND",
      status: 404,
    });
  });

  it("upserts lesson progress and returns normalized snapshot", async () => {
    const result = await updateLessonTime({
      childId: "child-1",
      lessonId: "lesson-1",
      secondsSpent: 95,
      accessedAt: "2026-02-22T10:15:00.000Z",
    });

    expect(result).toEqual({
      ok: true,
      data: {
        childId: "child-1",
        lessonId: "lesson-1",
        timeSpent: 155,
        lastAccessedAt: "2026-02-22T10:15:00.000Z",
      },
    });
    expect(prismaMock.childProfile.findFirst).toHaveBeenCalledWith({
      where: {
        id: "child-1",
        parentId: "parent-1",
      },
      select: { id: true },
    });
    expect(prismaMock.lesson.findUnique).toHaveBeenCalledWith({
      where: { id: "lesson-1" },
      select: { id: true },
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });
});
