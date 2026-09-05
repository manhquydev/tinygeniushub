import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getParentFromRequestMock,
  isParentAdminMock,
  listLiveCourseIdsMock,
  completeCourseMock,
  prismaMock,
} = vi.hoisted(() => ({
  getParentFromRequestMock: vi.fn(),
  isParentAdminMock: vi.fn(),
  listLiveCourseIdsMock: vi.fn(),
  completeCourseMock: vi.fn(),
  prismaMock: {
    course: { findUnique: vi.fn() },
    courseEnrollment: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));
vi.mock("@/lib/auth/admin", () => ({
  isParentAdmin: isParentAdminMock,
}));
vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: vi.fn(),
}));
vi.mock("@/modules/platform/security-access-guard", () => ({
  assertRequestAllowedBySecurityControls: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));
vi.mock("@/modules/entitlement/course-tickets", () => ({
  listLiveCourseIds: listLiveCourseIdsMock,
}));
vi.mock("@/modules/courses/course-service", () => ({
  completeCourse: completeCourseMock,
}));

import { POST } from "@/app/api/courses/[slug]/complete/route";

function request() {
  return new NextRequest("http://localhost/api/courses/phonics/complete", {
    method: "POST",
    body: JSON.stringify({}),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/courses/[slug]/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentFromRequestMock.mockResolvedValue({ id: "parent-1" });
    isParentAdminMock.mockReturnValue(false);
    prismaMock.course.findUnique.mockResolvedValue({ id: "course-a", slug: "phonics" });
    listLiveCourseIdsMock.mockResolvedValue([]);
  });

  it("denies complete without a household course ticket", async () => {
    const response = await POST(request(), { params: Promise.resolve({ slug: "phonics" }) });
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.error.details).toEqual({ code: "LEARN_ACCESS_DENIED" });
    expect(completeCourseMock).not.toHaveBeenCalled();
  });

  it("completes using an existing enrollment when ticketed", async () => {
    listLiveCourseIdsMock.mockResolvedValueOnce(["course-a"]);
    prismaMock.courseEnrollment.findUnique.mockResolvedValueOnce({ id: "enroll-1" });
    completeCourseMock.mockResolvedValueOnce({ id: "enroll-1", completedAt: new Date() });

    const response = await POST(request(), { params: Promise.resolve({ slug: "phonics" }) });
    expect(response.status).toBe(200);
    expect(completeCourseMock).toHaveBeenCalledWith("enroll-1");
    expect(prismaMock.courseEnrollment.create).not.toHaveBeenCalled();
  });
});
