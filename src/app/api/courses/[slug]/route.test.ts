import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getParentFromRequestMock, getCourseMock, listLiveCourseIdsMock } = vi.hoisted(() => ({
  getParentFromRequestMock: vi.fn(),
  getCourseMock: vi.fn(),
  listLiveCourseIdsMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));

vi.mock("@/modules/courses/course-service", () => ({
  getCourse: getCourseMock,
}));

vi.mock("@/modules/entitlement/course-tickets", () => ({
  listLiveCourseIds: listLiveCourseIdsMock,
}));

vi.mock("@/modules/courses/course-bundles", () => ({
  getCourseBundleByCourseSlug: vi.fn(() => null),
}));

vi.mock("@/modules/courses/course-storefront-content", () => ({
  getBundleStorefrontContent: vi.fn(),
}));

vi.mock("@/modules/courses/storefront-course-contract", () => ({
  STOREFRONT_COURSE_CONTRACT_VERSION: 1,
  buildStorefrontCourseContract: vi.fn(() => ({})),
}));

import { GET } from "@/app/api/courses/[slug]/route";

const course = {
  id: "course-a",
  slug: "phonics",
  isPublished: true,
  durationDays: 30,
  lessons: [],
};

describe("GET /api/courses/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentFromRequestMock.mockResolvedValue({ id: "parent-1" });
    getCourseMock.mockResolvedValue(course);
    listLiveCourseIdsMock.mockResolvedValue([]);
  });

  it("sets enrolled true when the household has a live course ticket", async () => {
    listLiveCourseIdsMock.mockResolvedValueOnce(["course-a"]);

    const response = await GET(new NextRequest("http://localhost/api/courses/phonics"), {
      params: Promise.resolve({ slug: "phonics" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.enrolled).toBe(true);
  });

  it("sets enrolled false for enrollment-only households without a ticket", async () => {
    const response = await GET(new NextRequest("http://localhost/api/courses/phonics"), {
      params: Promise.resolve({ slug: "phonics" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.enrolled).toBe(false);
    expect(listLiveCourseIdsMock).toHaveBeenCalledWith("parent-1");
  });
});
