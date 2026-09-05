import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    entitlement: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { courseCatalogKey, courseLevelCatalogKey } from "@/modules/entitlement/catalog-key";
import { listLiveCourseIds } from "@/modules/entitlement/course-tickets";
import { PLATFORM_PASS_KEY } from "@/modules/entitlement/offering-types";

const parentId = "parent-1";
const courseId = "course-abc";

describe("listLiveCourseIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.entitlement.findMany.mockResolvedValue([]);
  });

  it("returns the course id for an exact program ticket", async () => {
    prismaMock.entitlement.findMany.mockResolvedValueOnce([
      {
        validFrom: new Date("2020-01-01"),
        validUntil: null,
        offering: { catalogKey: courseCatalogKey(courseId) },
      },
    ]);

    await expect(listLiveCourseIds(parentId)).resolves.toEqual([courseId]);
  });

  it("excludes ONE_TIME_LEVEL tickets", async () => {
    prismaMock.entitlement.findMany.mockResolvedValueOnce([
      {
        validFrom: new Date("2020-01-01"),
        validUntil: null,
        offering: { catalogKey: courseLevelCatalogKey(courseId, "lvl-2") },
      },
    ]);

    await expect(listLiveCourseIds(parentId)).resolves.toEqual([]);
  });

  it("excludes platform-pass and track tickets", async () => {
    prismaMock.entitlement.findMany.mockResolvedValueOnce([
      {
        validFrom: new Date("2020-01-01"),
        validUntil: null,
        offering: { catalogKey: PLATFORM_PASS_KEY },
      },
      {
        validFrom: new Date("2020-01-01"),
        validUntil: null,
        offering: { catalogKey: "track:ENGLISH" },
      },
    ]);

    await expect(listLiveCourseIds(parentId)).resolves.toEqual([]);
  });

  it("excludes expired tickets", async () => {
    prismaMock.entitlement.findMany.mockResolvedValueOnce([
      {
        validFrom: new Date("2020-01-01"),
        validUntil: new Date("2020-02-01"),
        offering: { catalogKey: courseCatalogKey(courseId) },
      },
    ]);

    await expect(listLiveCourseIds(parentId)).resolves.toEqual([]);
  });
});
