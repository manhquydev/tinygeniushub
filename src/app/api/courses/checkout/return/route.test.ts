import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createCheckoutReturnState,
  hashCheckoutReturnState,
} from "@/modules/courses/course-checkout-return-state";

const {
  findUniqueMock,
  findFirstMock,
  assertRequestAllowedBySecurityControlsMock,
  getRateLimitPolicyMock,
  enforceRateLimitMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  findFirstMock: vi.fn(),
  assertRequestAllowedBySecurityControlsMock: vi.fn(),
  getRateLimitPolicyMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    paymentRecord: {
      findUnique: findUniqueMock,
    },
    childProfile: {
      findFirst: findFirstMock,
    },
  },
}));

vi.mock("@/modules/platform/security-access-guard", () => ({
  assertRequestAllowedBySecurityControls: assertRequestAllowedBySecurityControlsMock,
}));

vi.mock("@/modules/platform/security-policy-service", () => ({
  getRateLimitPolicy: getRateLimitPolicyMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
  getRequestIp: () => "203.0.113.9",
}));

import { GET } from "@/app/api/courses/checkout/return/route";

function buildState(orderCode: string, parentId: string) {
  return createCheckoutReturnState({
    orderCode,
    parentId,
    issuedAtMs: Date.now(),
  });
}

function buildPaymentRecord(input: { orderCode: string; parentId: string; status?: string }) {
  const state = buildState(input.orderCode, input.parentId);
  return {
    parentId: input.parentId,
    status: input.status ?? "PENDING",
    rawPayload: {
      payos: {
        paymentLinkId: "plink_expected",
        returnStateHash: hashCheckoutReturnState(state),
      },
    },
    state,
  };
}

describe("course checkout return route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertRequestAllowedBySecurityControlsMock.mockResolvedValue(undefined);
    getRateLimitPolicyMock.mockResolvedValue({
      limit: 120,
      windowMs: 600_000,
    });
    enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 119,
    });
  });

  it("returns generic error when state is missing", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/return?orderCode=123"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/courses?checkout=error");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns generic error when return endpoint is rate limited", async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterMs: 60_000,
      reason: "quota_exceeded",
    });

    const response = await GET(
      new NextRequest(
        `http://localhost/api/courses/checkout/return?orderCode=123&state=${encodeURIComponent("invalid")}`,
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/courses?checkout=error");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns processing when PayOS status=PAID but webhook has not updated payment record", async () => {
    const record = buildPaymentRecord({
      orderCode: "123",
      parentId: "parent-1",
      status: "PENDING",
    });
    findUniqueMock.mockResolvedValueOnce({
      parentId: record.parentId,
      status: record.status,
      rawPayload: record.rawPayload,
    });

    const response = await GET(
      new NextRequest(
        `http://localhost/api/courses/checkout/return?orderCode=123&status=PAID&state=${encodeURIComponent(record.state)}`,
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/courses?checkout=processing&orderCode=123");
  });

  it("returns generic error when paymentLink id does not match saved paymentLinkId", async () => {
    const record = buildPaymentRecord({
      orderCode: "123",
      parentId: "parent-1",
      status: "PENDING",
    });
    findUniqueMock.mockResolvedValueOnce({
      parentId: record.parentId,
      status: record.status,
      rawPayload: record.rawPayload,
    });

    const response = await GET(
      new NextRequest(
        `http://localhost/api/courses/checkout/return?orderCode=123&id=plink_other&state=${encodeURIComponent(record.state)}`,
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/courses?checkout=error");
  });

  it("redirects to child course after successful payment", async () => {
    const record = buildPaymentRecord({
      orderCode: "123",
      parentId: "parent-1",
      status: "SUCCEEDED",
    });
    findUniqueMock.mockResolvedValueOnce({
      parentId: record.parentId,
      status: record.status,
      rawPayload: {
        ...record.rawPayload,
        target: {
          kind: "course",
          courseSlug: "abeka-math",
        },
      },
    });
    findFirstMock.mockResolvedValueOnce({ id: "child-1" });

    const response = await GET(
      new NextRequest(
        `http://localhost/api/courses/checkout/return?orderCode=123&state=${encodeURIComponent(record.state)}`,
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/kid/courses/abeka-math?childId=child-1");
  });

  it("returns generic error for cancel=true to avoid status leak", async () => {
    const record = buildPaymentRecord({
      orderCode: "123",
      parentId: "parent-1",
      status: "PENDING",
    });
    findUniqueMock.mockResolvedValueOnce({
      parentId: record.parentId,
      status: record.status,
      rawPayload: record.rawPayload,
    });

    const response = await GET(
      new NextRequest(
        `http://localhost/api/courses/checkout/return?orderCode=123&cancel=true&state=${encodeURIComponent(record.state)}`,
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/courses?checkout=error");
  });
});
