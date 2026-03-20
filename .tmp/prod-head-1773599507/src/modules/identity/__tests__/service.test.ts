import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";

const {
  transactionMock,
  parentFindUniqueMock,
  parentUpdateMock,
  txParentCreateMock,
  txParentPreferencesCreateMock,
  txSubscriptionCreateMock,
  txUserUpsertMock,
  txAccountUpsertMock,
  hashPasswordMock,
  verifyPasswordMock,
} = vi.hoisted(() => ({
  transactionMock: vi.fn(),
  parentFindUniqueMock: vi.fn(),
  parentUpdateMock: vi.fn(),
  txParentCreateMock: vi.fn(),
  txParentPreferencesCreateMock: vi.fn(),
  txSubscriptionCreateMock: vi.fn(),
  txUserUpsertMock: vi.fn(),
  txAccountUpsertMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  verifyPasswordMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
    parentAccount: {
      findUnique: parentFindUniqueMock,
      update: parentUpdateMock,
    },
  },
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: hashPasswordMock,
  verifyPassword: verifyPasswordMock,
}));

import { authenticateParent, registerParent } from "@/modules/identity/service";

describe("registerParent", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hashPasswordMock.mockResolvedValue("hashed-secret");

    txParentCreateMock.mockResolvedValue({
      id: "parent-1",
      email: "parent@example.com",
      displayName: "Parent",
    });
    txParentPreferencesCreateMock.mockResolvedValue({});
    txSubscriptionCreateMock.mockResolvedValue({});
    txUserUpsertMock.mockResolvedValue({});
    txAccountUpsertMock.mockResolvedValue({});

    transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        parentAccount: { create: txParentCreateMock },
        parentPreferences: { create: txParentPreferencesCreateMock },
        subscription: { create: txSubscriptionCreateMock },
        user: { upsert: txUserUpsertMock },
        account: { upsert: txAccountUpsertMock },
      }),
    );
  });

  it("creates parent, default preferences, trial subscription, and auth mappings in one transaction", async () => {
    const parent = await registerParent({
      email: "Parent@Example.com",
      password: "StrongPass123!",
      displayName: "Parent",
    });

    expect(hashPasswordMock).toHaveBeenCalledWith("StrongPass123!");
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(txParentCreateMock).toHaveBeenCalledWith({
      data: {
        email: "parent@example.com",
        passwordHash: "hashed-secret",
        displayName: "Parent",
      },
    });
    expect(txParentPreferencesCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId: "parent-1",
        weeklyReportChannel: "IN_APP_AND_EMAIL",
        weeklyReportEmailEnabled: true,
      }),
    });
    expect(txSubscriptionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId: "parent-1",
        planCode: "TRIAL",
        status: "TRIALING",
        childProfileLimit: 3,
        caregiverLimit: 2,
        portfolioRetentionMaxDays: 90,
        currentPeriodStart: expect.any(Date),
        currentPeriodEnd: expect.any(Date),
        autoRenew: true,
      }),
    });
    expect(txUserUpsertMock).toHaveBeenCalledWith({
      where: { id: "parent-1" },
      create: expect.objectContaining({
        id: "parent-1",
        email: "parent@example.com",
        name: "Parent",
        parentId: "parent-1",
      }),
      update: expect.objectContaining({
        email: "parent@example.com",
        parentId: "parent-1",
      }),
    });
    expect(txAccountUpsertMock).toHaveBeenCalledWith({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: "parent-1",
        },
      },
      create: expect.objectContaining({
        id: "credential-parent-1",
        accountId: "parent-1",
        providerId: "credential",
        userId: "parent-1",
        password: "hashed-secret",
      }),
      update: expect.objectContaining({
        userId: "parent-1",
        password: "hashed-secret",
      }),
    });
    expect(parent).toEqual({
      id: "parent-1",
      email: "parent@example.com",
      displayName: "Parent",
    });
  });

  it("rethrows unknown transaction errors without masking", async () => {
    transactionMock.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(
      registerParent({
        email: "parent@example.com",
        password: "StrongPass123!",
      }),
    ).rejects.toThrow("database unavailable");
  });
});

describe("authenticateParent", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    parentFindUniqueMock.mockResolvedValue({
      id: "parent-1",
      email: "parent@example.com",
      passwordHash: "hashed-secret",
      displayName: "Parent",
      subscription: null,
      preferences: null,
    });
    verifyPasswordMock.mockResolvedValue(true);
    parentUpdateMock.mockResolvedValue({});
  });

  it("returns invalid credentials when parent is not found", async () => {
    parentFindUniqueMock.mockResolvedValueOnce(null);

    await expect(
      authenticateParent({
        email: "missing@example.com",
        password: "StrongPass123!",
      }),
    ).rejects.toMatchObject({
      name: "DomainError",
      status: 401,
      code: "INVALID_CREDENTIALS",
    } satisfies Partial<DomainError>);
  });

  it("returns invalid credentials when password does not match", async () => {
    verifyPasswordMock.mockResolvedValueOnce(false);

    await expect(
      authenticateParent({
        email: "parent@example.com",
        password: "WrongPass123!",
      }),
    ).rejects.toMatchObject({
      name: "DomainError",
      status: 401,
      code: "INVALID_CREDENTIALS",
    } satisfies Partial<DomainError>);

    expect(parentUpdateMock).not.toHaveBeenCalled();
  });

  it("normalizes email and updates lastActiveAt on successful authentication", async () => {
    const parent = await authenticateParent({
      email: "Parent@Example.com",
      password: "StrongPass123!",
    });

    expect(parentFindUniqueMock).toHaveBeenCalledWith({
      where: { email: "parent@example.com" },
      include: {
        subscription: true,
        preferences: true,
      },
    });
    expect(verifyPasswordMock).toHaveBeenCalledWith("StrongPass123!", "hashed-secret");
    expect(parentUpdateMock).toHaveBeenCalledWith({
      where: { id: "parent-1" },
      data: { lastActiveAt: expect.any(Date) },
    });
    expect(parent.id).toBe("parent-1");
  });
});
