import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, createCheckoutSessionMock, createAuditLogMock } = vi.hoisted(() => ({
  prismaMock: {
    parentAccount: {
      findUnique: vi.fn(),
    },
    offering: {
      findUnique: vi.fn(),
    },
  },
  createCheckoutSessionMock: vi.fn(),
  createAuditLogMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/billing/providers", () => ({
  resolveBillingProvider: () => ({
    createCheckoutSession: createCheckoutSessionMock,
  }),
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: createAuditLogMock,
}));

import { createBillingCheckoutSession } from "@/modules/billing/checkout-service";

const parentId = "parent-1";

describe("createBillingCheckoutSession offering guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.parentAccount.findUnique.mockResolvedValue({
      id: parentId,
      email: "parent@example.com",
    });
    createCheckoutSessionMock.mockResolvedValue({
      provider: "mock_gateway",
      checkoutUrl: "https://checkout.example/session",
      externalSessionId: "sess-1",
      expiresAt: new Date("2026-09-06T12:00:00.000Z"),
    });
  });

  it("refuses checkout when platform-pass offering is missing", async () => {
    prismaMock.offering.findUnique.mockResolvedValue(null);

    await expect(
      createBillingCheckoutSession({
        parentId,
        input: { planCode: "MONTHLY_STANDARD" },
      }),
    ).rejects.toMatchObject({
      status: 404,
      code: "OFFERING_NOT_FOUND",
    });

    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
    expect(createAuditLogMock).not.toHaveBeenCalled();
  });

  it("refuses checkout when platform-pass offering is inactive", async () => {
    prismaMock.offering.findUnique.mockResolvedValue({
      stripePriceId: "price_1",
      active: false,
    });

    await expect(
      createBillingCheckoutSession({
        parentId,
        input: { planCode: "MONTHLY_STANDARD" },
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "OFFERING_INACTIVE",
    });

    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
    expect(createAuditLogMock).not.toHaveBeenCalled();
  });

  it("creates a checkout session when the offering is active", async () => {
    prismaMock.offering.findUnique.mockResolvedValue({
      stripePriceId: "price_1",
      active: true,
    });

    const result = await createBillingCheckoutSession({
      parentId,
      input: { planCode: "MONTHLY_STANDARD" },
    });

    expect(createCheckoutSessionMock).toHaveBeenCalledTimes(1);
    expect(result.externalSessionId).toBe("sess-1");
    expect(createAuditLogMock).toHaveBeenCalledTimes(1);
  });
});
