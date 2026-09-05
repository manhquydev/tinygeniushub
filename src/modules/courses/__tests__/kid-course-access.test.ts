import { beforeEach, describe, expect, it, vi } from "vitest";
import { courseCatalogKey, courseLevelCatalogKey } from "@/modules/entitlement/catalog-key";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    course: { findUnique: vi.fn() },
    entitlement: { findMany: vi.fn() },
    courseEnrollment: { findUnique: vi.fn(), findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { resolveKidCourseAccess } from "@/modules/courses/kid-course-access";

const parentId = "parent-1";

function liveTicket(catalogKey: string) {
  return {
    validFrom: new Date("2020-01-01"),
    validUntil: null,
    offering: { catalogKey },
  };
}

function publishedCourse(id: string, slug: string) {
  return { id, slug, isPublished: true };
}

describe("resolveKidCourseAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.entitlement.findMany.mockResolvedValue([]);
  });

  it("allows a published course covered by a household ticket", async () => {
    prismaMock.course.findUnique.mockResolvedValueOnce(publishedCourse("course-a", "course-a"));
    prismaMock.entitlement.findMany.mockResolvedValueOnce([liveTicket(courseCatalogKey("course-a"))]);

    await expect(
      resolveKidCourseAccess({ parentId, requestedSlug: "course-a" }),
    ).resolves.toMatchObject({ hasAccess: true, course: { id: "course-a" } });
    expect(prismaMock.courseEnrollment.findUnique).not.toHaveBeenCalled();
  });

  it("denies enrollment-only access without a ticket", async () => {
    prismaMock.course.findUnique.mockResolvedValueOnce(publishedCourse("course-a", "course-a"));

    await expect(
      resolveKidCourseAccess({ parentId, requestedSlug: "course-a" }),
    ).resolves.toMatchObject({ hasAccess: false });
    expect(prismaMock.courseEnrollment.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.courseEnrollment.findFirst).not.toHaveBeenCalled();
  });

  it("denies sibling slug B when only course A is ticketed", async () => {
    prismaMock.course.findUnique.mockResolvedValueOnce(publishedCourse("course-b", "course-b"));
    prismaMock.entitlement.findMany.mockResolvedValueOnce([liveTicket(courseCatalogKey("course-a"))]);

    await expect(
      resolveKidCourseAccess({ parentId, requestedSlug: "course-b" }),
    ).resolves.toMatchObject({ hasAccess: false, resolvedSlug: "course-b" });
  });

  it("does not unlock a program with a level ticket", async () => {
    prismaMock.course.findUnique.mockResolvedValueOnce(publishedCourse("course-a", "course-a"));
    prismaMock.entitlement.findMany.mockResolvedValueOnce([
      liveTicket(courseLevelCatalogKey("course-a", "lvl-2")),
    ]);

    await expect(
      resolveKidCourseAccess({ parentId, requestedSlug: "course-a" }),
    ).resolves.toMatchObject({ hasAccess: false });
  });

  it("does not remap a bundle-root slug onto the legacy monolith", async () => {
    prismaMock.course.findUnique.mockResolvedValueOnce(null);
    prismaMock.entitlement.findMany.mockResolvedValueOnce([
      liveTicket(courseCatalogKey("lfen-level-1-id")),
    ]);

    await expect(
      resolveKidCourseAccess({ parentId, requestedSlug: "little-fox-en" }),
    ).resolves.toMatchObject({
      hasAccess: false,
      resolvedSlug: "little-fox-en",
      course: null,
    });
    expect(prismaMock.course.findUnique).toHaveBeenCalledWith({
      where: { slug: "little-fox-en" },
      select: { id: true, slug: true, isPublished: true },
    });
  });

  it("does not dump monolith lessons from a split-SKU ticket", async () => {
    prismaMock.course.findUnique.mockResolvedValueOnce(publishedCourse("littlefox-id", "littlefox"));
    prismaMock.entitlement.findMany.mockResolvedValueOnce([
      liveTicket(courseCatalogKey("lfen-level-1-id")),
    ]);

    await expect(
      resolveKidCourseAccess({ parentId, requestedSlug: "littlefox" }),
    ).resolves.toMatchObject({ hasAccess: false, resolvedSlug: "littlefox" });
  });

  it("denies unpublished courses even with a ticket", async () => {
    prismaMock.course.findUnique.mockResolvedValueOnce({
      id: "course-a",
      slug: "course-a",
      isPublished: false,
    });
    prismaMock.entitlement.findMany.mockResolvedValueOnce([liveTicket(courseCatalogKey("course-a"))]);

    await expect(
      resolveKidCourseAccess({ parentId, requestedSlug: "course-a" }),
    ).resolves.toMatchObject({ hasAccess: false });
  });
});
