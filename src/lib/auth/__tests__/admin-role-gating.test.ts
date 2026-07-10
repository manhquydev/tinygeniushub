import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ADMIN_MODULE_CATALOG } from "@/components/admin/admin-module-catalog";
import { DomainError } from "@/modules/platform/errors";

const APP_ROOT = path.resolve(__dirname, "../../../app/(main)");

function readPageSource(href: string) {
  const segments = href.split("/").filter(Boolean);
  const pagePath = path.join(APP_ROOT, ...segments, "page.tsx");
  expect(fs.existsSync(pagePath), `expected page file to exist: ${pagePath}`).toBe(true);
  return fs.readFileSync(pagePath, "utf8");
}

describe("admin catalog conformance: superAdminOnly pages", () => {
  const superAdminModules = ADMIN_MODULE_CATALOG.filter(
    (module) => module.superAdminOnly && module.href,
  );

  it("catalog still lists the expected superAdminOnly modules", () => {
    // Guards against silent catalog drift (a module losing its flag by omission).
    expect(superAdminModules.map((module) => module.key).sort()).toEqual(
      [
        "organizations",
        "staff",
        "security",
        "audit-log",
        "impersonation",
        "skills-mapping",
        "feature-flags",
      ].sort(),
    );
  });

  it.each(superAdminModules.map((module) => [module.key, module.href as string]))(
    "page for module '%s' (%s) calls requireSuperAdminParent",
    (_key, href) => {
      const source = readPageSource(href);
      expect(source).toContain("requireSuperAdminParent");
    },
  );
});

const { requireAdminSessionMock } = vi.hoisted(() => ({
  requireAdminSessionMock: vi.fn(),
}));

vi.mock("@/modules/admin/admin-auth-service", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("@/modules/platform/security-access-guard", () => ({
  assertRequestAllowedBySecurityControls: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: vi.fn(),
}));

vi.mock("@/lib/security/admin-rate-limit", () => ({
  enforceAdminMutationRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/modules/admin/service", () => ({
  createAdminActionLog: vi.fn().mockResolvedValue({ id: "log-1" }),
}));

import { GET as organizationsGet, POST as organizationsPost } from "@/app/api/admin/organizations/route";
import { POST as organizationMembersPost } from "@/app/api/admin/organizations/[id]/members/route";

function rejectAsStaff() {
  requireAdminSessionMock.mockRejectedValueOnce(
    new DomainError("Forbidden: Insufficient permissions", 403, "FORBIDDEN"),
  );
}

describe("admin API matrix: organizations module rejects non-super-admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/admin/organizations rejects staff-role session", async () => {
    rejectAsStaff();

    const response = await organizationsGet(
      new NextRequest("http://localhost/api/admin/organizations"),
    );

    expect(response.status).toBe(403);
    expect(requireAdminSessionMock).toHaveBeenCalledWith(["SUPER_ADMIN"]);
  });

  it("POST /api/admin/organizations rejects staff-role session", async () => {
    rejectAsStaff();

    const response = await organizationsPost(
      new NextRequest("http://localhost/api/admin/organizations", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost" },
        body: JSON.stringify({ name: "Org", slug: "org" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(requireAdminSessionMock).toHaveBeenCalledWith(["SUPER_ADMIN"]);
  });

  it("POST /api/admin/organizations/[id]/members rejects staff-role session", async () => {
    rejectAsStaff();

    const response = await organizationMembersPost(
      new NextRequest("http://localhost/api/admin/organizations/org-1/members", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost" },
        body: JSON.stringify({ parentId: "parent-1" }),
      }),
      { params: Promise.resolve({ id: "org-1" }) },
    );

    expect(response.status).toBe(403);
    expect(requireAdminSessionMock).toHaveBeenCalledWith(["SUPER_ADMIN"]);
  });
});
