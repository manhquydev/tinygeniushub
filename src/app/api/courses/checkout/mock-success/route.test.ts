import { PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  findUniqueMock,
  paymentUpdateMock,
  transactionMock,
  upsertMock,
  courseFindUniqueMock,
  childFindFirstMock,
  auditFindFirstMock,
  logWarnMock,
  grantCourseOfferingInTxMock,
  getPublishedCoursesByBundleSlugMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  paymentUpdateMock: vi.fn(),
  transactionMock: vi.fn(),
  upsertMock: vi.fn(),
  courseFindUniqueMock: vi.fn(),
  childFindFirstMock: vi.fn(),
  auditFindFirstMock: vi.fn(),
  logWarnMock: vi.fn(),
  grantCourseOfferingInTxMock: vi.fn(),
  getPublishedCoursesByBundleSlugMock: vi.fn(),
}));

const envMock = vi.hoisted(() => ({
  env: {
    COURSE_PAYMENT_PROVIDER: "mock_gateway",
    NODE_ENV: "production",
    ALLOW_PROD_MOCK_CHECKOUT_CALLBACK: false,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    paymentRecord: {
      findUnique: findUniqueMock,
      update: paymentUpdateMock,
    },
    $transaction: transactionMock,
    course: { findUnique: courseFindUniqueMock },
    childProfile: { findFirst: childFindFirstMock },
    auditLog: { findFirst: auditFindFirstMock },
  },
}));

vi.mock("@/lib/env", () => envMock);

vi.mock("@/lib/observability/logger", () => ({
  logInfo: vi.fn(),
  logWarn: logWarnMock,
}));

vi.mock("@/modules/courses/pilot-attribution", () => ({
  parsePilotAttributionSnapshot: vi.fn(() => null),
}));

vi.mock("@/modules/courses/course-bundle-service", () => ({
  getPublishedCoursesByBundleSlug: getPublishedCoursesByBundleSlugMock,
}));

vi.mock("@/modules/courses/pilot-funnel-tracking-service", () => ({
  trackPilotPurchaseSucceeded: vi.fn(),
}));

vi.mock("@/modules/entitlement/grant-from-billing", () => ({
  grantCourseOfferingInTx: grantCourseOfferingInTxMock,
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: vi.fn(),
}));

import { GET } from "@/app/api/courses/checkout/mock-success/route";

function pendingPayment(target: Record<string, unknown>) {
  return {
    id: "pay-1",
    parentId: "parent-1",
    amountVnd: 199000,
    status: PaymentStatus.PENDING,
    rawPayload: { target },
  };
}

describe("course checkout mock-success route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.env.COURSE_PAYMENT_PROVIDER = "mock_gateway";
    envMock.env.NODE_ENV = "production";
    envMock.env.ALLOW_PROD_MOCK_CHECKOUT_CALLBACK = false;
    transactionMock.mockImplementation(async (fn: (tx: { courseEnrollment: { upsert: typeof upsertMock } }) => Promise<unknown>) => {
      return fn({ courseEnrollment: { upsert: upsertMock } });
    });
    upsertMock.mockResolvedValue({});
    paymentUpdateMock.mockResolvedValue({});
    grantCourseOfferingInTxMock.mockResolvedValue({ id: "ent-1" });
    childFindFirstMock.mockResolvedValue({ id: "child-1" });
    auditFindFirstMock.mockResolvedValue({ id: "audit-1" });
    courseFindUniqueMock.mockResolvedValue({ slug: "phonics-1" });
  });

  it("rejects immediately when provider is not mock_gateway", async () => {
    envMock.env.COURSE_PAYMENT_PROVIDER = "payos";

    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/mock-success?courseId=course-1&sessionId=s1"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/courses?error=invalid_checkout");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("blocks all checkouts in production when mock callback is disabled", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/mock-success?courseId=course-1&sessionId=s1"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/courses?error=invalid_checkout");
    expect(logWarnMock).toHaveBeenCalledWith(
      "courses.mock_checkout.disabled",
      expect.objectContaining({ allowProdMockCallback: false }),
    );
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("redirects to invalid_checkout when prod guard fires regardless of amount", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/mock-success?courseId=course-1&sessionId=s1"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/courses?error=invalid_checkout");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("grants a live course ticket in the same tx as the bundle enrollment upsert", async () => {
    envMock.env.NODE_ENV = "development";
    findUniqueMock.mockResolvedValueOnce(
      pendingPayment({ kind: "bundle", bundleSlug: "littlefox" }),
    );
    getPublishedCoursesByBundleSlugMock.mockResolvedValueOnce({
      bundle: { entryCourseSlug: "littlefox" },
      courses: [
        { id: "c1", slug: "littlefox-l1" },
        { id: "c2", slug: "littlefox-l2" },
      ],
      legacyCourses: [],
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/courses/checkout/mock-success?bundleSlug=littlefox&sessionId=s1",
      ),
    );

    expect(response.status).toBe(307);
    expect(grantCourseOfferingInTxMock).toHaveBeenCalledTimes(2);
    expect(upsertMock).toHaveBeenCalledTimes(2);
    const tx = grantCourseOfferingInTxMock.mock.calls[0]?.[0];
    expect(grantCourseOfferingInTxMock).toHaveBeenNthCalledWith(1, tx, {
      parentId: "parent-1",
      courseId: "c1",
      sourcePaymentId: "pay-1",
    });
    expect(grantCourseOfferingInTxMock).toHaveBeenNthCalledWith(2, tx, {
      parentId: "parent-1",
      courseId: "c2",
      sourcePaymentId: "pay-1",
    });
  });

  it("grants a live course ticket in the same tx as the single-course enrollment upsert", async () => {
    envMock.env.NODE_ENV = "development";
    findUniqueMock.mockResolvedValueOnce(
      pendingPayment({ kind: "course", courseId: "course-1" }),
    );

    const response = await GET(
      new NextRequest(
        "http://localhost/api/courses/checkout/mock-success?courseId=course-1&sessionId=s1",
      ),
    );

    expect(response.status).toBe(307);
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(grantCourseOfferingInTxMock).toHaveBeenCalledTimes(1);
    expect(grantCourseOfferingInTxMock).toHaveBeenCalledWith(
      { courseEnrollment: { upsert: upsertMock } },
      {
        parentId: "parent-1",
        courseId: "course-1",
        sourcePaymentId: "pay-1",
      },
    );
  });
});
