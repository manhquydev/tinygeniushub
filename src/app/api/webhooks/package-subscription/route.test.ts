import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  enforceRateLimitMock,
  getRequestIpMock,
  logWarnMock,
  isValidBillingSignatureMock,
  assertRequestAllowedBySecurityControlsMock,
  getRateLimitPolicyMock,
  envMock,
  prismaMock,
} = vi.hoisted(() => ({
  enforceRateLimitMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  logWarnMock: vi.fn(),
  isValidBillingSignatureMock: vi.fn(),
  assertRequestAllowedBySecurityControlsMock: vi.fn(),
  getRateLimitPolicyMock: vi.fn(),
  envMock: {
    NODE_ENV: "test",
    BILLING_WEBHOOK_MAX_BYTES: 256 * 1024,
  },
  prismaMock: {
    paymentRecord: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    packageSubscription: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/env", () => ({ env: envMock }));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
  getRequestIp: getRequestIpMock,
}));
vi.mock("@/modules/billing/webhook-service", () => ({
  isValidBillingSignature: isValidBillingSignatureMock,
}));
vi.mock("@/lib/observability/logger", () => ({
  logInfo: vi.fn(),
  logWarn: logWarnMock,
  logError: vi.fn(),
}));
vi.mock("@/modules/platform/security-access-guard", () => ({
  assertRequestAllowedBySecurityControls: assertRequestAllowedBySecurityControlsMock,
}));
vi.mock("@/modules/platform/security-policy-service", () => ({
  getRateLimitPolicy: getRateLimitPolicyMock,
}));
vi.mock("@/worker/queue", () => ({
  enqueueTransactionalEmail: vi.fn(),
}));
vi.mock("@/lib/email/project-email-template-builder", () => ({
  resolveEmailPublicBaseUrl: vi.fn(() => "http://localhost:3000"),
}));
vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { POST } from "@/app/api/webhooks/package-subscription/route";

describe("package-subscription webhook lock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.NODE_ENV = "test";
    assertRequestAllowedBySecurityControlsMock.mockResolvedValue(undefined);
    getRateLimitPolicyMock.mockResolvedValue({ limit: 100, windowMs: 60_000 });
    getRequestIpMock.mockReturnValue("127.0.0.1");
    enforceRateLimitMock.mockResolvedValue({ allowed: true });
    isValidBillingSignatureMock.mockReturnValue(false);
  });

  it("returns 401 for unsigned payloads outside production", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/package-subscription", {
        method: "POST",
        body: JSON.stringify({ paymentId: "p1", parentId: "parent-1", status: "SUCCESS" }),
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(isValidBillingSignatureMock).toHaveBeenCalledWith(expect.any(String), null);
    expect(prismaMock.packageSubscription.create).not.toHaveBeenCalled();
    expect(prismaMock.packageSubscription.update).not.toHaveBeenCalled();
  });

  it("returns 404 for unsigned payloads in production", async () => {
    envMock.NODE_ENV = "production";
    const response = await POST(
      new Request("http://localhost/api/webhooks/package-subscription", {
        method: "POST",
        body: JSON.stringify({ paymentId: "p1", parentId: "parent-1", status: "SUCCESS" }),
      }) as never,
    );

    expect(response.status).toBe(404);
    expect(isValidBillingSignatureMock).toHaveBeenCalledWith(expect.any(String), null);
    expect(prismaMock.packageSubscription.create).not.toHaveBeenCalled();
    expect(prismaMock.packageSubscription.update).not.toHaveBeenCalled();
  });
});
