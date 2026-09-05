import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getParentFromRequestMock, prismaMock, getReviewQueueMock } = vi.hoisted(() => ({
  getParentFromRequestMock: vi.fn(),
  prismaMock: { childProfile: { findFirst: vi.fn() } },
  getReviewQueueMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/modules/adaptive/spaced-repetition-service", () => ({
  getReviewQueue: getReviewQueueMock,
}));

import { GET } from "@/app/api/adaptive/review-queue/route";

describe("GET /api/adaptive/review-queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentFromRequestMock.mockResolvedValue({ id: "parent-1" });
    prismaMock.childProfile.findFirst.mockResolvedValue(null);
  });

  it("returns 403 when the child is not owned by the parent", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/adaptive/review-queue?childId=other"),
    );
    expect(response.status).toBe(403);
    expect(getReviewQueueMock).not.toHaveBeenCalled();
  });

  it("returns the owned child's queue", async () => {
    prismaMock.childProfile.findFirst.mockResolvedValueOnce({ id: "child-1", parentId: "parent-1" });
    getReviewQueueMock.mockResolvedValueOnce([
      {
        id: "q1",
        skill: { id: "s1" },
        scheduledAt: new Date("2020-01-01"),
        intervalDays: 1,
        repetitions: 0,
      },
    ]);

    const response = await GET(
      new NextRequest("http://localhost/api/adaptive/review-queue?childId=child-1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getReviewQueueMock).toHaveBeenCalledWith("child-1");
    expect(body.data.dueCount).toBe(1);
  });
});
