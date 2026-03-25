import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireAdminFromRequestMock,
  assertTrustedOriginMock,
  enforceAdminMutationRateLimitMock,
  createAdminActionLogMock,
  hashMock,
  prismaMock,
} = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceAdminMutationRateLimitMock: vi.fn(),
  createAdminActionLogMock: vi.fn(),
  hashMock: vi.fn(),
  prismaMock: {
    adminAccount: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
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

vi.mock("bcryptjs", () => ({
  hash: hashMock,
}));

import { POST } from "@/app/api/admin/staff/route";

describe("admin staff route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "owner@example.com",
      role: "SUPER_ADMIN",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-password");
    createAdminActionLogMock.mockResolvedValue({ id: "log-1" });
    prismaMock.adminAccount.create.mockResolvedValue({
      id: "staff-1",
      email: "staff@example.com",
      displayName: "Staff",
      role: "SUPPORT_AGENT",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date("2026-03-25T00:00:00.000Z"),
    });
  });

  it("blocks creating another SUPER_ADMIN when one already exists", async () => {
    prismaMock.adminAccount.findFirst.mockResolvedValueOnce({
      id: "admin-existing",
      email: "existing-super@example.com",
    });

    const response = await POST(
      new NextRequest("http://localhost/api/admin/staff", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          email: "new-super@example.com",
          password: "StrongPass123!",
          displayName: "New Super",
          role: "SUPER_ADMIN",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.message).toContain("Only one SUPER_ADMIN is allowed");
    expect(prismaMock.adminAccount.create).not.toHaveBeenCalled();
  });

  it("creates non-super admin account successfully", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/admin/staff", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          email: "staff@example.com",
          password: "StrongPass123!",
          displayName: "Staff",
          role: "SUPPORT_AGENT",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(prismaMock.adminAccount.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.adminAccount.create).toHaveBeenCalledTimes(1);
    expect(createAdminActionLogMock).toHaveBeenCalledWith({
      adminEmail: "owner@example.com",
      action: "CREATE_STAFF_ACCOUNT",
      target: "staff@example.com",
      detail: {
        role: "SUPPORT_AGENT",
      },
    });
  });
});
