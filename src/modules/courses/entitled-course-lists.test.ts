import { beforeEach, describe, expect, it, vi } from "vitest";
import { courseCatalogKey } from "@/modules/entitlement/catalog-key";

const { listLiveCourseIdsMock, prismaMock } = vi.hoisted(() => ({
  listLiveCourseIdsMock: vi.fn(),
  prismaMock: {
    course: { findMany: vi.fn() },
    entitlement: { findMany: vi.fn() },
    childCourseJourney: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/entitlement/course-tickets", () => ({
  listLiveCourseIds: listLiveCourseIdsMock,
}));

vi.mock("@/modules/courses/course-media", () => ({
  resolveCourseCoverImage: (_slug: string, coverImageUrl?: string | null) => coverImageUrl ?? null,
}));

import {
  listEntitledCoursesForChild,
  listEntitledCoursesForParent,
} from "@/modules/courses/entitled-course-lists";

const parentId = "parent-1";
const childId = "child-1";

function courseRow(overrides: {
  id: string;
  slug: string;
  title: string;
  durationDays?: number;
}) {
  return {
    id: overrides.id,
    slug: overrides.slug,
    title: overrides.title,
    description: `${overrides.title} desc`,
    coverImageUrl: null,
    durationDays: overrides.durationDays ?? 30,
    priceVnd: 100000,
    listPriceVnd: 120000,
    salePriceVnd: null,
    saleStartsAt: null,
    saleEndsAt: null,
    _count: { lessons: 4 },
  };
}

describe("entitled course lists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listLiveCourseIdsMock.mockResolvedValue([]);
    prismaMock.course.findMany.mockResolvedValue([]);
    prismaMock.entitlement.findMany.mockResolvedValue([]);
    prismaMock.childCourseJourney.findMany.mockResolvedValue([]);
  });

  it("returns [] without prisma in:[] when there are no live course tickets", async () => {
    await expect(listEntitledCoursesForParent(parentId)).resolves.toEqual([]);
    await expect(listEntitledCoursesForChild({ parentId, childId })).resolves.toEqual([]);

    expect(prismaMock.course.findMany).not.toHaveBeenCalled();
    expect(prismaMock.entitlement.findMany).not.toHaveBeenCalled();
    expect(prismaMock.childCourseJourney.findMany).not.toHaveBeenCalled();
  });

  it("lists one published ticketed course per id and keeps the ticketed slug", async () => {
    listLiveCourseIdsMock.mockResolvedValue(["course-split", "course-hidden"]);
    prismaMock.course.findMany.mockResolvedValue([
      courseRow({ id: "course-split", slug: "littlefox-phonics", title: "Phonics" }),
    ]);
    prismaMock.entitlement.findMany.mockResolvedValue([
      {
        validFrom: new Date("2026-01-02"),
        offering: { catalogKey: courseCatalogKey("course-split") },
      },
    ]);

    const rows = await listEntitledCoursesForParent(parentId);

    expect(prismaMock.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["course-split", "course-hidden"] }, isPublished: true },
      }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.course.id).toBe("course-split");
    expect(rows[0]?.course.slug).toBe("littlefox-phonics");
    expect(rows[0]).not.toHaveProperty("enrollmentId");
    expect(rows[0]).not.toHaveProperty("enrolledAt");
    expect(rows[0]).not.toHaveProperty("completedAt");
  });

  it("sorts by ticket validFrom then title", async () => {
    listLiveCourseIdsMock.mockResolvedValue(["c-z", "c-a", "c-b"]);
    prismaMock.course.findMany.mockResolvedValue([
      courseRow({ id: "c-z", slug: "z", title: "Zebra" }),
      courseRow({ id: "c-a", slug: "a", title: "Apple" }),
      courseRow({ id: "c-b", slug: "b", title: "Berry" }),
    ]);
    prismaMock.entitlement.findMany.mockResolvedValue([
      { validFrom: new Date("2026-03-01"), offering: { catalogKey: courseCatalogKey("c-z") } },
      { validFrom: new Date("2026-03-01"), offering: { catalogKey: courseCatalogKey("c-a") } },
      { validFrom: new Date("2026-01-01"), offering: { catalogKey: courseCatalogKey("c-b") } },
    ]);

    const rows = await listEntitledCoursesForParent(parentId);
    expect(rows.map((row) => row.course.id)).toEqual(["c-b", "c-a", "c-z"]);
  });

  it("attaches the child journey without enrollment ledger fields", async () => {
    listLiveCourseIdsMock.mockResolvedValue(["course-1"]);
    prismaMock.course.findMany.mockResolvedValue([
      courseRow({ id: "course-1", slug: "course-one", title: "One" }),
    ]);
    prismaMock.entitlement.findMany.mockResolvedValue([
      { validFrom: new Date("2026-01-01"), offering: { catalogKey: courseCatalogKey("course-1") } },
    ]);
    prismaMock.childCourseJourney.findMany.mockResolvedValue([
      {
        id: "journey-1",
        courseId: "course-1",
        status: "ACTIVE",
        seedName: "Oak",
        currentTierNo: 2,
        currentTierProgress: 40,
        tiers: [
          { isCompleted: true, lessonCompleted: 3 },
          { isCompleted: false, lessonCompleted: 1 },
        ],
      },
    ]);

    const rows = await listEntitledCoursesForChild({ parentId, childId });
    expect(rows).toEqual([
      {
        course: expect.objectContaining({ id: "course-1", slug: "course-one" }),
        journey: {
          id: "journey-1",
          status: "ACTIVE",
          seedName: "Oak",
          currentTierNo: 2,
          currentTierProgress: 40,
          totalTiers: 2,
          completedTiers: 1,
          completedLessons: 4,
        },
      },
    ]);
    expect(rows[0]).not.toHaveProperty("enrollmentId");
    expect(rows[0]).not.toHaveProperty("enrolledAt");
    expect(rows[0]).not.toHaveProperty("completedAt");
    expect(prismaMock.childCourseJourney.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { childId, courseId: { in: ["course-1"] } },
      }),
    );
  });
});
