import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { findUniqueMock, logWarnMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  logWarnMock: vi.fn(),
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
    },
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
  getPublishedCoursesByBundleSlug: vi.fn(),
}));

vi.mock("@/modules/courses/pilot-funnel-tracking-service", () => ({
  trackPilotPurchaseSucceeded: vi.fn(),
}));

vi.mock("@/modules/courses/course-service", () => ({
  enrollParent: vi.fn(),
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: vi.fn(),
}));

import { GET } from "@/app/api/courses/checkout/mock-success/route";

describe("course checkout mock-success route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.env.COURSE_PAYMENT_PROVIDER = "mock_gateway";
    envMock.env.NODE_ENV = "production";
    envMock.env.ALLOW_PROD_MOCK_CHECKOUT_CALLBACK = false;
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

  it("blocks non-zero checkout in production when mock callback is disabled", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "payment-1",
      parentId: "parent-1",
      amountVnd: 120000,
      status: "PENDING",
      rawPayload: {},
    });

    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/mock-success?courseId=course-1&sessionId=s1"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/courses?error=invalid_checkout");
    expect(logWarnMock).toHaveBeenCalledWith(
      "courses.mock_checkout.disabled",
      expect.objectContaining({ reason: "production_non_zero_blocked" }),
    );
  });

  it("allows zero-amount checkout to continue past disabled production guard", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "payment-1",
      parentId: "parent-1",
      amountVnd: 0,
      status: "FAILED",
      rawPayload: {},
    });

    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/mock-success?courseId=course-1&sessionId=s1"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/courses?error=checkout_failed");
  });
});
