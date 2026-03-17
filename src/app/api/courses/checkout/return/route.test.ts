import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { findUniqueMock, findFirstMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  findFirstMock: vi.fn(),
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

import { GET } from "@/app/api/courses/checkout/return/route";

describe("course checkout return route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cancelled immediately when cancel=true is present", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/return?orderCode=123&cancel=true"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/courses?checkout=cancelled&orderCode=123");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns failed immediately when status=FAILED", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/return?orderCode=123&status=FAILED"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/courses?checkout=failed&orderCode=123");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns processing when PayOS status=PAID but webhook has not updated payment record", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "p1",
      parentId: "parent-1",
      status: "PENDING",
      rawPayload: {},
    });

    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/return?orderCode=123&status=PAID"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/courses?checkout=processing&orderCode=123");
  });

  it("rejects request when id does not match saved paymentLinkId", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "p1",
      parentId: "parent-1",
      status: "PENDING",
      rawPayload: {
        payos: {
          paymentLinkId: "plink_expected",
        },
      },
    });

    const response = await GET(
      new NextRequest("http://localhost/api/courses/checkout/return?orderCode=123&id=plink_other"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/courses?checkout=invalid");
  });

  it("redirects to child course after successful payment", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "p1",
      parentId: "parent-1",
      status: "SUCCEEDED",
      rawPayload: {
        target: {
          kind: "course",
          courseSlug: "abeka-math",
        },
      },
    });
    findFirstMock.mockResolvedValueOnce({ id: "child-1" });

    const response = await GET(new NextRequest("http://localhost/api/courses/checkout/return?orderCode=123"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/kid/courses/abeka-math?childId=child-1");
  });
});
