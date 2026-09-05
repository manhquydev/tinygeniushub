import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getParentFromRequestMock, prismaMock, resolveKidCourseAccessMock } = vi.hoisted(() => ({
  getParentFromRequestMock: vi.fn(),
  prismaMock: {
    childProfile: { findFirst: vi.fn() },
    course: { findUnique: vi.fn() },
    childCourseJourney: { findUnique: vi.fn() },
  },
  resolveKidCourseAccessMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/modules/courses/kid-course-access", () => ({
  resolveKidCourseAccess: resolveKidCourseAccessMock,
}));

import { GET } from "@/app/api/courses/[slug]/lessons/route";

function lessonsRequest(slug: string) {
  return GET(
    new NextRequest(`http://localhost/api/courses/${slug}/lessons?childId=child-1`),
    { params: Promise.resolve({ slug }) },
  );
}

describe("GET /api/courses/[slug]/lessons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentFromRequestMock.mockResolvedValue({ id: "parent-1" });
    prismaMock.childProfile.findFirst.mockResolvedValue({ id: "child-1" });
  });

  it("returns 403 LEARN_ACCESS_DENIED when ticket A does not cover slug B", async () => {
    resolveKidCourseAccessMock.mockResolvedValueOnce({
      requestedSlug: "course-b",
      resolvedSlug: "course-b",
      course: { id: "course-b", slug: "course-b" },
      bundle: null,
      hasAccess: false,
    });

    const response = await lessonsRequest("course-b");
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.details.code).toBe("LEARN_ACCESS_DENIED");
    expect(body.error.message).not.toBe("Not enrolled in this course");
    expect(prismaMock.course.findUnique).not.toHaveBeenCalled();
  });

  it("returns lessons when the requested course is ticketed", async () => {
    resolveKidCourseAccessMock.mockResolvedValueOnce({
      requestedSlug: "course-a",
      resolvedSlug: "course-a",
      course: { id: "course-a", slug: "course-a" },
      bundle: null,
      hasAccess: true,
    });
    prismaMock.course.findUnique.mockResolvedValueOnce({
      id: "course-a",
      slug: "course-a",
      title: "Course A",
      lessons: [],
    });
    prismaMock.childCourseJourney.findUnique.mockResolvedValueOnce(null);

    const response = await lessonsRequest("course-a");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.lessons).toEqual([]);
  });
});
