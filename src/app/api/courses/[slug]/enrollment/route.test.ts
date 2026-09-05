import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getParentFromRequestMock, getEnrollmentMock, resolveKidCourseAccessMock } = vi.hoisted(
  () => ({
    getParentFromRequestMock: vi.fn(),
    getEnrollmentMock: vi.fn(),
    resolveKidCourseAccessMock: vi.fn(),
  }),
);

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));
vi.mock("@/modules/courses/course-service", () => ({
  getEnrollment: getEnrollmentMock,
}));
vi.mock("@/modules/courses/kid-course-access", () => ({
  resolveKidCourseAccess: resolveKidCourseAccessMock,
}));

import { GET } from "@/app/api/courses/[slug]/enrollment/route";

function enrollmentRequest(slug: string) {
  return GET(new NextRequest(`http://localhost/api/courses/${slug}/enrollment`), {
    params: Promise.resolve({ slug }),
  });
}

describe("GET /api/courses/[slug]/enrollment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentFromRequestMock.mockResolvedValue({ id: "parent-1" });
  });

  it("returns enrolled true with null ledger for ticket-only access", async () => {
    resolveKidCourseAccessMock.mockResolvedValueOnce({
      course: { id: "course-a", slug: "course-a" },
      hasAccess: true,
    });
    getEnrollmentMock.mockResolvedValueOnce(null);

    const response = await enrollmentRequest("course-a");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ enrolled: true, enrollment: null });
  });

  it("returns enrolled false with ledger when enrollment exists without a ticket", async () => {
    const ledger = { id: "enroll-1", courseId: "course-a", parentId: "parent-1" };
    resolveKidCourseAccessMock.mockResolvedValueOnce({
      course: { id: "course-a", slug: "course-a" },
      hasAccess: false,
    });
    getEnrollmentMock.mockResolvedValueOnce(ledger);

    const response = await enrollmentRequest("course-a");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ enrolled: false, enrollment: ledger });
  });
});
