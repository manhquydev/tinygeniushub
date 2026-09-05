import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getParentFromRequestMock,
  prismaMock,
  isAdaptiveEnabledForChildMock,
  getNextLessonMock,
} = vi.hoisted(() => ({
  getParentFromRequestMock: vi.fn(),
  prismaMock: { childProfile: { findFirst: vi.fn() } },
  isAdaptiveEnabledForChildMock: vi.fn(),
  getNextLessonMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/feature-flags", () => ({
  isAdaptiveEnabledForChild: isAdaptiveEnabledForChildMock,
}));
vi.mock("@/modules/adaptive/content-sequencing-engine", () => ({
  getNextLesson: getNextLessonMock,
}));

import { GET } from "@/app/api/adaptive/next-lesson/route";

describe("GET /api/adaptive/next-lesson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentFromRequestMock.mockResolvedValue({ id: "parent-1" });
    prismaMock.childProfile.findFirst.mockResolvedValue(null);
  });

  it("returns 403 when the child is not owned by the parent", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/adaptive/next-lesson?childId=other&domain=MATH"),
    );
    expect(response.status).toBe(403);
    expect(getNextLessonMock).not.toHaveBeenCalled();
  });

  it("uses the owned child id when adaptive is enabled", async () => {
    prismaMock.childProfile.findFirst.mockResolvedValueOnce({ id: "child-1", parentId: "parent-1" });
    isAdaptiveEnabledForChildMock.mockResolvedValueOnce(true);
    getNextLessonMock.mockResolvedValueOnce({ lesson: { id: "lesson-1" } });

    const response = await GET(
      new NextRequest("http://localhost/api/adaptive/next-lesson?childId=child-1&domain=MATH"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getNextLessonMock).toHaveBeenCalledWith("child-1", "MATH");
    expect(body.data.source).toBe("adaptive");
  });
});
