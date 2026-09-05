import { beforeEach, describe, expect, it, vi } from "vitest";

const { listLiveCourseIdsMock } = vi.hoisted(() => ({
  listLiveCourseIdsMock: vi.fn(),
}));

vi.mock("@/modules/entitlement/course-tickets", () => ({
  listLiveCourseIds: listLiveCourseIdsMock,
}));

import { assertParentHasCourseTicket } from "@/modules/garden/assert-course-ticket";

describe("assertParentHasCourseTicket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listLiveCourseIdsMock.mockResolvedValue([]);
  });

  it("allows an exact program ticket", async () => {
    listLiveCourseIdsMock.mockResolvedValueOnce(["course-a"]);
    await expect(
      assertParentHasCourseTicket({ parentId: "parent-1", courseId: "course-a" }),
    ).resolves.toBeUndefined();
  });

  it("rejects when the course is not in live program tickets", async () => {
    listLiveCourseIdsMock.mockResolvedValueOnce(["course-b"]);
    await expect(
      assertParentHasCourseTicket({ parentId: "parent-1", courseId: "course-a" }),
    ).rejects.toMatchObject({
      status: 403,
      code: "COURSE_TICKET_REQUIRED",
    });
  });
});
