import { describe, expect, it } from "vitest";
import { computeJourneyProgressFromTiers, computeJourneyTiers } from "@/modules/garden/journey-service";

describe("journey-service tier computation", () => {
  const lessons = [
    { orderNo: 1, lessonId: "l1", levelId: "level-k4", levelOrderNo: 1001, levelTitle: "Abeka K4" },
    { orderNo: 2, lessonId: "l2", levelId: "level-k4", levelOrderNo: 1001, levelTitle: "Abeka K4" },
    { orderNo: 3, lessonId: "l3", levelId: "level-k5", levelOrderNo: 1002, levelTitle: "Abeka K5" },
  ];

  it("groups lessons by level and unlocks tiers sequentially", () => {
    const tiers = computeJourneyTiers({
      courseSlug: "abeka",
      lessons,
      completedLessonIds: new Set(["l1"]),
    });

    expect(tiers).toHaveLength(2);
    expect(tiers[0]).toMatchObject({
      tierNo: 1,
      title: "Abeka K4",
      lessonTotal: 2,
      lessonCompleted: 1,
      isUnlocked: true,
      isCompleted: false,
    });
    expect(tiers[1]).toMatchObject({
      tierNo: 2,
      title: "Abeka K5",
      lessonTotal: 1,
      lessonCompleted: 0,
      isUnlocked: false,
      isCompleted: false,
    });
  });

  it("promotes status to ACTIVE when there is progress", () => {
    const tiers = computeJourneyTiers({
      courseSlug: "abeka",
      lessons,
      completedLessonIds: new Set(["l1"]),
    });

    const progress = computeJourneyProgressFromTiers(tiers);
    expect(progress.status).toBe("ACTIVE");
    expect(progress.currentTierNo).toBe(1);
    expect(progress.currentTierProgress).toBe(0.5);
    expect(progress.completedLessons).toBe(1);
    expect(progress.totalLessons).toBe(3);
  });

  it("unlocks next tier and marks journey completed when all lessons are done", () => {
    const tiers = computeJourneyTiers({
      courseSlug: "abeka",
      lessons,
      completedLessonIds: new Set(["l1", "l2", "l3"]),
    });

    expect(tiers[1]?.isUnlocked).toBe(true);

    const progress = computeJourneyProgressFromTiers(tiers);
    expect(progress.status).toBe("COMPLETED");
    expect(progress.currentTierNo).toBe(2);
    expect(progress.currentTierProgress).toBe(1);
  });

  it("keeps SEEDED status when no completion exists", () => {
    const tiers = computeJourneyTiers({
      courseSlug: "abeka",
      lessons,
      completedLessonIds: new Set<string>(),
    });

    const progress = computeJourneyProgressFromTiers(tiers);
    expect(progress.status).toBe("SEEDED");
    expect(progress.currentTierNo).toBe(1);
    expect(progress.currentTierProgress).toBe(0);
  });
});

