import { EntitlementStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    offering: { findUnique: vi.fn() },
    entitlement: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lesson: { findUnique: vi.fn() },
    childProfile: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { DomainError } from "@/modules/platform/errors";
import { buildLessonCatalogKeys, ticketCoversLesson } from "@/modules/entitlement/catalog-key";
import { canAccess, expireEntitlement, grantEntitlement, listEntitlements } from "@/modules/entitlement/entitlement-service";
import { PLATFORM_PASS_KEY } from "@/modules/entitlement/offering-types";

const parentId = "parent-1";
const offeringId = "offering-pass";
const lessonId = "lesson-1";

function lessonRow(overrides?: { levelId?: string; trackCode?: string; courseIds?: string[] }) {
  return {
    unit: {
      level: {
        id: overrides?.levelId ?? "level-real",
        track: { code: overrides?.trackCode ?? "ENGLISH" },
      },
    },
    courseItems: (overrides?.courseIds ?? ["course-abc"]).map((courseId) => ({ courseId })),
  };
}

describe("catalog keys", () => {
  it("uses Lesson.unit.level.id not CourseLesson.orderNo", () => {
    expect(
      buildLessonCatalogKeys({
        trackCode: "ENGLISH",
        levelId: "level-real",
        courseIds: ["course-abc"],
      }),
    ).toEqual([
      PLATFORM_PASS_KEY,
      "track:ENGLISH",
      "course:course-abc",
      "course:course-abc:level:level-real",
    ]);
    expect(buildLessonCatalogKeys({ trackCode: "ENGLISH", levelId: "level-real", courseIds: ["course-abc"] })).not.toContain(
      "course:course-abc:level:7",
    );
  });

  it("lets course:<id> cover course:<id>:level:* and platform:pass cover kernel lessons", () => {
    const keys = buildLessonCatalogKeys({
      trackCode: "MATH",
      levelId: "lvl-2",
      courseIds: ["c1"],
    });
    expect(ticketCoversLesson(PLATFORM_PASS_KEY, keys)).toBe(true);
    expect(ticketCoversLesson("course:c1", keys)).toBe(true);
    expect(ticketCoversLesson("course:c1:level:lvl-2", keys)).toBe(true);
    expect(ticketCoversLesson("course:other", keys)).toBe(false);
    expect(ticketCoversLesson(PLATFORM_PASS_KEY, [])).toBe(false);
  });
});

describe("entitlement-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
      callback(prismaMock),
    );
  });

  it("grants a parent-scoped ticket and lists it", async () => {
    const ticket = { id: "ent-1", parentId, offeringId, status: EntitlementStatus.ACTIVE };
    prismaMock.offering.findUnique.mockResolvedValueOnce({ id: offeringId, catalogKey: PLATFORM_PASS_KEY });
    prismaMock.entitlement.findFirst.mockResolvedValueOnce(null);
    prismaMock.entitlement.create.mockResolvedValueOnce(ticket);
    prismaMock.entitlement.findMany.mockResolvedValueOnce([ticket]);

    await expect(grantEntitlement({ parentId, offeringId })).resolves.toEqual(ticket);
    await expect(listEntitlements(parentId)).resolves.toEqual([ticket]);
    expect(prismaMock.entitlement.create.mock.calls[0][0].data.parentId).toBe(parentId);
    expect(prismaMock.entitlement.create.mock.calls[0][0].data).not.toHaveProperty("childId");
  });

  it("rejects a second live ticket then allows grant after expire", async () => {
    prismaMock.offering.findUnique.mockResolvedValue({ id: offeringId, catalogKey: PLATFORM_PASS_KEY });
    prismaMock.entitlement.findFirst.mockResolvedValueOnce({ id: "ent-live", status: EntitlementStatus.ACTIVE });

    await expect(grantEntitlement({ parentId, offeringId })).rejects.toMatchObject({
      code: "ENTITLEMENT_ALREADY_ACTIVE",
    } satisfies Partial<DomainError>);

    prismaMock.entitlement.findFirst.mockResolvedValueOnce({ id: "ent-live", parentId });
    prismaMock.entitlement.update.mockResolvedValueOnce({ id: "ent-live", status: EntitlementStatus.EXPIRED });
    await expect(expireEntitlement({ parentId, entitlementId: "ent-live" })).resolves.toMatchObject({
      status: EntitlementStatus.EXPIRED,
    });

    prismaMock.entitlement.findFirst.mockResolvedValueOnce(null);
    prismaMock.entitlement.create.mockResolvedValueOnce({ id: "ent-2", status: EntitlementStatus.ACTIVE });
    await expect(grantEntitlement({ parentId, offeringId })).resolves.toMatchObject({ id: "ent-2" });
  });

  it("shares access across children of the same parent and denies other parents and expiry", async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(lessonRow());
    prismaMock.childProfile.findFirst.mockImplementation(async ({ where }: { where: { id: string; parentId: string } }) =>
      where.parentId === parentId ? { id: where.id } : null,
    );
    prismaMock.entitlement.findMany.mockResolvedValue([
      {
        validFrom: new Date("2020-01-01"),
        validUntil: null,
        offering: { catalogKey: PLATFORM_PASS_KEY },
      },
    ]);

    await expect(canAccess({ parentId, lessonId, childId: "child-a" })).resolves.toBe(true);
    await expect(canAccess({ parentId, lessonId, childId: "child-b" })).resolves.toBe(true);
    await expect(canAccess({ parentId: "other-parent", lessonId, childId: "child-a" })).resolves.toBe(false);
    expect(prismaMock.lessonCompletion).toBeUndefined();

    prismaMock.entitlement.findMany.mockResolvedValue([
      {
        validFrom: new Date("2020-01-01"),
        validUntil: new Date("2020-02-01"),
        offering: { catalogKey: PLATFORM_PASS_KEY },
      },
    ]);
    await expect(canAccess({ parentId, lessonId })).resolves.toBe(false);
  });
});
