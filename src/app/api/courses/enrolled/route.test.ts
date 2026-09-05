import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getParentFromRequestMock, findFirstMock, listEntitledCoursesForChildMock } = vi.hoisted(
  () => ({
    getParentFromRequestMock: vi.fn(),
    findFirstMock: vi.fn(),
    listEntitledCoursesForChildMock: vi.fn(),
  }),
);

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    childProfile: { findFirst: findFirstMock },
  },
}));

vi.mock("@/modules/courses/entitled-course-lists", () => ({
  listEntitledCoursesForChild: listEntitledCoursesForChildMock,
}));

import { GET } from "@/app/api/courses/enrolled/route";

describe("GET /api/courses/enrolled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentFromRequestMock.mockResolvedValue({ id: "parent-1" });
    findFirstMock.mockResolvedValue({ id: "child-1" });
    listEntitledCoursesForChildMock.mockResolvedValue([]);
  });

  it("returns 404 when the child is not owned by the parent", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    const response = await GET(
      new NextRequest("http://localhost/api/courses/enrolled?childId=child-other"),
    );

    expect(response.status).toBe(404);
    expect(listEntitledCoursesForChildMock).not.toHaveBeenCalled();
  });

  it("returns the ticket list for an owned child", async () => {
    const courses = [{ course: { id: "course-1", slug: "phonics" }, journey: null }];
    listEntitledCoursesForChildMock.mockResolvedValueOnce(courses);

    const response = await GET(
      new NextRequest("http://localhost/api/courses/enrolled?childId=child-1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, data: { courses } });
    expect(listEntitledCoursesForChildMock).toHaveBeenCalledWith({
      parentId: "parent-1",
      childId: "child-1",
    });
  });
});
