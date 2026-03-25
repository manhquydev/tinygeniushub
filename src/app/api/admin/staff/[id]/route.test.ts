import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireAdminFromRequestMock,
  assertTrustedOriginMock,
  enforceAdminMutationRateLimitMock,
  createAdminActionLogMock,
  prismaMock,
} = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceAdminMutationRateLimitMock: vi.fn(),
  createAdminActionLogMock: vi.fn(),
  prismaMock: {
    adminAccount: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdminFromRequest: requireAdminFromRequestMock,
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/security/admin-rate-limit", () => ({
  enforceAdminMutationRateLimit: enforceAdminMutationRateLimitMock,
}));

vi.mock("@/modules/admin/service", () => ({
  createAdminActionLog: createAdminActionLogMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { PATCH } from "@/app/api/admin/staff/[id]/route";

describe("admin staff detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "owner@example.com",
      role: "SUPER_ADMIN",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
    createAdminActionLogMock.mockResolvedValue({ id: "log-1" });
    prismaMock.adminAccount.update.mockResolvedValue({
      id: "staff-1",
      email: "staff@example.com",
      displayName: "Staff",
      role: "SUPPORT_AGENT",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date("2026-03-25T00:00:00.000Z"),
    });
  });

  it("blocks promoting another account to SUPER_ADMIN when one already exists", async () => {
    prismaMock.adminAccount.findUnique.mockResolvedValueOnce({
      id: "staff-1",
      email: "staff@example.com",
      role: "SUPPORT_AGENT",
      isActive: true,
    });
    prismaMock.adminAccount.findFirst.mockResolvedValueOnce({
      id: "admin-super",
    });

    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/staff/staff-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          role: "SUPER_ADMIN",
        }),
      }),
      { params: Promise.resolve({ id: "staff-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.message).toContain("Only one SUPER_ADMIN is allowed");
    expect(prismaMock.adminAccount.update).not.toHaveBeenCalled();
  });

  it("blocks demoting last active SUPER_ADMIN account", async () => {
    prismaMock.adminAccount.findUnique.mockResolvedValueOnce({
      id: "admin-super",
      email: "owner@example.com",
      role: "SUPER_ADMIN",
      isActive: true,
    });
    prismaMock.adminAccount.count.mockResolvedValueOnce(1);

    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/staff/admin-super", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          role: "SUPPORT_AGENT",
        }),
      }),
      { params: Promise.resolve({ id: "admin-super" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe("System must keep at least one active SUPER_ADMIN account.");
    expect(prismaMock.adminAccount.update).not.toHaveBeenCalled();
  });

  it("updates staff account when policy checks pass", async () => {
    prismaMock.adminAccount.findUnique.mockResolvedValueOnce({
      id: "staff-1",
      email: "staff@example.com",
      role: "SUPPORT_AGENT",
      isActive: true,
    });

    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/staff/staff-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          displayName: "Staff Updated",
        }),
      }),
      { params: Promise.resolve({ id: "staff-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(prismaMock.adminAccount.update).toHaveBeenCalledTimes(1);
    expect(createAdminActionLogMock).toHaveBeenCalledTimes(1);
  });
});
