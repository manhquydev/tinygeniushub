import { EntitlementStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  enrollmentUpsertMock,
  offeringUpsertMock,
  entitlementFindFirstMock,
  entitlementCreateMock,
  courseFindUniqueMock,
  enrollmentFindUniqueMock,
  childFindFirstMock,
  auditFindFirstMock,
  transactionMock,
} = vi.hoisted(() => ({
  enrollmentUpsertMock: vi.fn(),
  offeringUpsertMock: vi.fn(),
  entitlementFindFirstMock: vi.fn(),
  entitlementCreateMock: vi.fn(),
  courseFindUniqueMock: vi.fn(),
  enrollmentFindUniqueMock: vi.fn(),
  childFindFirstMock: vi.fn(),
  auditFindFirstMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
    course: { findUnique: courseFindUniqueMock },
    courseEnrollment: { findUnique: enrollmentFindUniqueMock },
    childProfile: { findFirst: childFindFirstMock },
    auditLog: { findFirst: auditFindFirstMock },
  },
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: vi.fn(),
}));

vi.mock("@/modules/courses/pilot-funnel-tracking-service", () => ({
  trackPilotCheckoutStarted: vi.fn(),
}));

import { createCourseCheckoutSession } from "@/modules/courses/course-checkout-service";

const parentId = "parent-1";
const courseId = "course-1";
const slug = "free-phonics";

function freeCourse() {
  return {
    id: courseId,
    slug,
    title: "Free Phonics",
    isPublished: true,
    priceVnd: 199000,
    listPriceVnd: 199000,
    salePriceVnd: 0,
    saleStartsAt: null,
    saleEndsAt: null,
  };
}

function createTx() {
  return {
    courseEnrollment: { upsert: enrollmentUpsertMock },
    offering: { upsert: offeringUpsertMock },
    entitlement: {
      findFirst: entitlementFindFirstMock,
      create: entitlementCreateMock,
    },
  };
}

describe("createCourseCheckoutSession free checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const tx = createTx();
    transactionMock.mockImplementation(async (work: (client: typeof tx) => Promise<unknown>) =>
      work(tx),
    );
    courseFindUniqueMock.mockResolvedValue(freeCourse());
    enrollmentFindUniqueMock.mockResolvedValue({
      id: "enroll-1",
      courseId,
      parentId,
    });
    enrollmentUpsertMock.mockResolvedValue({ id: "enroll-1", courseId, parentId });
    offeringUpsertMock.mockResolvedValue({
      id: "offering-course",
      code: `course-${courseId}`,
    });
    entitlementFindFirstMock.mockResolvedValue(null);
    entitlementCreateMock.mockResolvedValue({
      id: "ent-1",
      status: EntitlementStatus.ACTIVE,
    });
    childFindFirstMock.mockResolvedValue({ id: "child-1" });
    auditFindFirstMock.mockResolvedValue({ id: "audit-1" });
  });

  it("grants a live course ticket when the parent is already enrolled", async () => {
    const result = await createCourseCheckoutSession({
      parentId,
      parentEmail: "parent@example.com",
      slug,
      attribution: null,
    });

    expect(result.provider).toBe("free_temporary");
    expect(enrollmentUpsertMock).toHaveBeenCalledWith({
      where: { courseId_parentId: { courseId, parentId } },
      update: {},
      create: { courseId, parentId },
    });
    expect(entitlementCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId,
        offeringId: "offering-course",
        status: EntitlementStatus.ACTIVE,
        validUntil: null,
      }),
    });
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(result.checkoutUrl).toContain(`/kid/courses/${slug}`);
  });
});
