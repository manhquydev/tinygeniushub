import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  assertRequestAllowedBySecurityControlsMock,
  getParentFromRequestMock,
  paymentFindFirstMock,
  childFindFirstMock,
} = vi.hoisted(() => ({
  assertRequestAllowedBySecurityControlsMock: vi.fn(),
  getParentFromRequestMock: vi.fn(),
  paymentFindFirstMock: vi.fn(),
  childFindFirstMock: vi.fn(),
}));

vi.mock("@/modules/platform/security-access-guard", () => ({
  assertRequestAllowedBySecurityControls: assertRequestAllowedBySecurityControlsMock,
}));

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    paymentRecord: {
      findFirst: paymentFindFirstMock,
    },
    childProfile: {
      findFirst: childFindFirstMock,
    },
  },
}));

import { GET } from "@/app/api/courses/checkout/status/route";

describe("courses checkout status route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertRequestAllowedBySecurityControlsMock.mockResolvedValue(undefined);
    getParentFromRequestMock.mockResolvedValue({
      id: "parent-1",
      email: "parent@example.com",
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    getParentFromRequestMock.mockResolvedValueOnce(null);

    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/status?orderCode=123"),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Unauthorized");
  });

  it("returns 400 when orderCode is missing", async () => {
    const response = await GET(new NextRequest("http://localhost/api/courses/checkout/status"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Missing orderCode");
  });

  it("returns not_found when payment record does not exist", async () => {
    paymentFindFirstMock.mockResolvedValueOnce(null);

    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/status?orderCode=123"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("not_found");
  });

  it("returns failed when payment status is FAILED", async () => {
    paymentFindFirstMock.mockResolvedValueOnce({
      status: "FAILED",
      rawPayload: {},
    });

    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/status?orderCode=123"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("failed");
  });

  it("returns succeeded with redirect path after successful checkout", async () => {
    paymentFindFirstMock.mockResolvedValueOnce({
      status: "SUCCEEDED",
      rawPayload: {
        target: {
          kind: "course",
          courseSlug: "abeka",
        },
      },
    });
    childFindFirstMock.mockResolvedValueOnce({
      id: "child-1",
    });

    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/status?orderCode=123"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("succeeded");
    expect(body.data.redirectTo).toBe("/kid/courses/abeka?childId=child-1");
  });
});

