import { describe, expect, it, vi } from "vitest";
import {
  isLessonWithinPublicPreviewWindow,
  isPublicPreviewEligibleLesson,
} from "@/modules/courses/course-trial-policy";

describe("isLessonWithinPublicPreviewWindow", () => {
  it("returns true when lesson is in top preview limit by rank", () => {
    const rows = [
      { courseId: "course-a", lessonId: "l-1", orderNo: 10 },
      { courseId: "course-a", lessonId: "l-2", orderNo: 20 },
      { courseId: "course-a", lessonId: "l-3", orderNo: 30 },
    ];

    expect(isLessonWithinPublicPreviewWindow(rows, "l-2", 2)).toBe(true);
  });

  it("returns false when lesson is outside preview limit by rank", () => {
    const rows = [
      { courseId: "course-a", lessonId: "l-1", orderNo: 10 },
      { courseId: "course-a", lessonId: "l-2", orderNo: 20 },
      { courseId: "course-a", lessonId: "l-3", orderNo: 30 },
    ];

    expect(isLessonWithinPublicPreviewWindow(rows, "l-3", 2)).toBe(false);
  });

  it("returns true when any published course places lesson within preview window", () => {
    const rows = [
      { courseId: "course-a", lessonId: "shared-lesson", orderNo: 50 },
      { courseId: "course-a", lessonId: "a-2", orderNo: 60 },
      { courseId: "course-b", lessonId: "b-1", orderNo: 100 },
      { courseId: "course-b", lessonId: "shared-lesson", orderNo: 200 },
    ];

    expect(isLessonWithinPublicPreviewWindow(rows, "shared-lesson", 2)).toBe(true);
  });

  it("checks preview eligibility by ranked position, not absolute order number", async () => {
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([{ courseId: "course-a" }])
      .mockResolvedValueOnce([
        { courseId: "course-a", lessonId: "l-1", orderNo: 10 },
        { courseId: "course-a", lessonId: "target-lesson", orderNo: 20 },
      ]);

    const db = {
      courseLesson: {
        findMany,
      },
    } as unknown as Parameters<typeof isPublicPreviewEligibleLesson>[0];

    const eligible = await isPublicPreviewEligibleLesson(db, "target-lesson");
    expect(eligible).toBe(true);
    expect(findMany).toHaveBeenCalledTimes(2);
  });
});
