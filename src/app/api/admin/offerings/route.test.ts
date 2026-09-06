import { OfferingKind } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DomainError } from "@/modules/platform/errors";

const { requireAdminFromRequestMock, listAdminOfferingsMock } = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  listAdminOfferingsMock: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdminFromRequest: requireAdminFromRequestMock,
}));

vi.mock("@/modules/admin/admin-offering-service", () => ({
  listAdminOfferings: listAdminOfferingsMock,
}));

import { GET } from "@/app/api/admin/offerings/route";

describe("admin offerings GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "support@example.com",
      role: "SUPPORT_AGENT",
    });
    listAdminOfferingsMock.mockResolvedValue([
      {
        id: "off-1",
        code: "platform-pass",
        kind: OfferingKind.RECURRING,
        catalogKey: "platform:pass",
        active: true,
        stripePriceId: "price_1",
      },
    ]);
  });

  it("lists offerings for any admin role", async () => {
    const request = new NextRequest("http://localhost/api/admin/offerings");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(requireAdminFromRequestMock).toHaveBeenCalledWith(request);
    expect(requireAdminFromRequestMock.mock.calls[0]?.[1]).toBeUndefined();
    expect(body.ok).toBe(true);
    expect(body.data.offerings).toEqual([
      {
        id: "off-1",
        code: "platform-pass",
        kind: OfferingKind.RECURRING,
        catalogKey: "platform:pass",
        active: true,
        stripePriceId: "price_1",
      },
    ]);
  });

  it("maps forbidden auth errors", async () => {
    requireAdminFromRequestMock.mockRejectedValueOnce(
      new DomainError("Unauthorized", 401, "UNAUTHORIZED"),
    );

    const response = await GET(new NextRequest("http://localhost/api/admin/offerings"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(listAdminOfferingsMock).not.toHaveBeenCalled();
  });
});
